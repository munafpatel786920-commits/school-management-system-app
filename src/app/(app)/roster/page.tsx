'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useData } from '@/context/data-context'
import type { Student } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { ListOrdered, Save } from 'lucide-react'

type RosterItem = {
  studentId: string
  name: string // to avoid lookups
  currentRollNo: string
  newRollNo: string
}

export default function RosterPage() {
  const { students, updateStudent } = useData()
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [roster, setRoster] = useState<RosterItem[]>([])

  const classes = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'Active' || !s.status);
    const allClasses = activeStudents.map((s) => `${s.class} '${s.section}'`)
    return [...new Set(allClasses)].sort()
  }, [students])

  const studentsInClass = useMemo(() => {
    if (!selectedClass) return []
    const [className, sectionWithQuote] = selectedClass.split(" '")
    const section = sectionWithQuote.replace("'", "")
    return students.filter(
      (s) => s.class === className && s.section === section && (s.status === 'Active' || !s.status)
    );
  }, [selectedClass, students])

  useEffect(() => {
    if (studentsInClass.length > 0) {
      // Sort by current roll number if they exist, otherwise by name
      const sortedStudents = [...studentsInClass].sort((a, b) => {
        const rollA = parseInt(a.rollNo);
        const rollB = parseInt(b.rollNo);
        if (!isNaN(rollA) && !isNaN(rollB)) {
          return rollA - rollB;
        }
        return a.name.localeCompare(b.name);
      });

      setRoster(sortedStudents.map(s => ({
        studentId: s.id,
        name: s.name,
        currentRollNo: s.rollNo,
        newRollNo: s.rollNo,
      })));
    } else {
      setRoster([]);
    }
  }, [studentsInClass]);

  const handleRollNoChange = (studentId: string, newRollNo: string) => {
    setRoster(prev => prev.map(item => 
      item.studentId === studentId ? { ...item, newRollNo } : item
    ));
  }

  const assignAlphabetically = () => {
    const sortedRoster = [...roster].sort((a, b) => a.name.localeCompare(b.name));
    setRoster(sortedRoster.map((item, index) => ({
      ...item,
      newRollNo: (index + 1).toString(),
    })));
    toast({ title: "Roll Numbers Assigned", description: "Roll numbers have been assigned alphabetically. Click Save to apply." });
  }

  const saveChanges = () => {
    let updatedCount = 0;
    const rollNumbers = new Set<string>();
    let hasDuplicates = false;

    roster.forEach(item => {
      if (item.newRollNo && rollNumbers.has(item.newRollNo)) {
        hasDuplicates = true;
      }
      if (item.newRollNo) {
        rollNumbers.add(item.newRollNo);
      }
    });

    if (hasDuplicates) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Roll Numbers',
        description: 'Please ensure all new roll numbers are unique before saving.',
      });
      return;
    }

    roster.forEach(item => {
      if (item.currentRollNo !== item.newRollNo) {
        const student = students.find(s => s.id === item.studentId);
        if (student) {
          updateStudent({ ...student, rollNo: item.newRollNo });
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      toast({ title: "Changes Saved", description: `${updatedCount} student(s) have been updated.` });
    } else {
      toast({ title: "No Changes", description: "No roll numbers were changed." });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Manage Class Roster</CardTitle>
        <CardDescription>
          Assign and update roll numbers for students in a class.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Select onValueChange={setSelectedClass} value={selectedClass}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>
                  Class {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={assignAlphabetically} disabled={!selectedClass || roster.length === 0} className="w-full">
              <ListOrdered className="mr-2 h-4 w-4" />
              Assign Alphabetically
            </Button>
            <Button onClick={saveChanges} disabled={!selectedClass || roster.length === 0} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {selectedClass ? (
          roster.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Current Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="w-[150px]">New Roll No.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((item) => (
                    <TableRow key={item.studentId}>
                      <TableCell className="font-medium text-center">{item.currentRollNo || 'N/A'}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Input 
                          value={item.newRollNo}
                          onChange={(e) => handleRollNoChange(item.studentId, e.target.value)}
                          className="w-24 text-center"
                          placeholder="N/A"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-[400px]">
                <p className="text-muted-foreground">No active students found in this class section.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-[400px]">
            <ListOrdered className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-headline text-foreground mb-2">
              Select a class to manage its roster
            </h3>
            <p className="text-muted-foreground max-w-xs">
              Once you select a class, you can assign or update student roll numbers.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
