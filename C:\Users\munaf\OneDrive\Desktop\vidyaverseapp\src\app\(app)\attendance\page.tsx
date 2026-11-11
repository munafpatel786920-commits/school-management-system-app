'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useData } from '@/context/data-context'
import { toast } from '@/hooks/use-toast'
import { useFirestore, addDocumentNonBlocking, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'

type AttendanceStatus = 'present' | 'absent'

export default function AttendancePage() {
  const [date, setDate] = useState<Date | undefined>()
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const { students } = useData()
  const firestore = useFirestore();

  const attendanceColRef = useMemoFirebase(() => (firestore) ? collection(firestore, 'attendance') : null, [firestore]);

  useEffect(() => {
    setDate(new Date());
  }, []);

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
    ).sort((a,b) => parseInt(a.rollNo) - parseInt(b.rollNo));
  }, [selectedClass, students])

  useEffect(() => {
    setAttendance({});
  }, [selectedClass]);

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const handleSaveAttendance = () => {
    if (!selectedClass || studentsInClass.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a class with students.',
      })
      return
    }

    if(!attendanceColRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to database. Are you logged in?' });
        return;
    }

    const unMarkedStudentsCount = studentsInClass.filter(student => !attendance[student.id]).length;
    if (unMarkedStudentsCount > 0) {
       toast({
        variant: 'destructive',
        title: 'Incomplete Attendance',
        description: `Please mark attendance for all ${studentsInClass.length} students. ${unMarkedStudentsCount} remaining.`,
      })
      return
    }

    const attendanceDate = format(date || new Date(), 'yyyy-MM-dd');

    Object.entries(attendance).forEach(([studentId, status]) => {
        addDocumentNonBlocking(attendanceColRef, {
            date: attendanceDate,
            studentId,
            status,
            class: selectedClass
        });
    });

    toast({
      title: 'Attendance Saved',
      description: `Attendance for Class ${selectedClass} on ${format(date || new Date(), 'PPP')} has been saved.`,
    })
  }

  const setAllAttendance = (status: AttendanceStatus) => {
    if(studentsInClass.length === 0) return;
    const newAttendance: Record<string, AttendanceStatus> = {};
    studentsInClass.forEach(student => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
    toast({
      title: `All Marked as ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      description: `All ${studentsInClass.length} students have been marked as ${status}.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Take Attendance</CardTitle>
        <CardDescription>
          Select a date and class to mark student attendance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full sm:w-[240px] justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
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
        </div>

        {selectedClass ? (
            <div className='space-y-4'>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium font-headline">
                        Students List ({studentsInClass.length})
                    </h3>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAllAttendance('present')}>Mark All Present</Button>
                        <Button variant="outline" size="sm" onClick={() => setAllAttendance('absent')}>Mark All Absent</Button>
                    </div>
                </div>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Roll No.</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead className="text-right w-[250px] pr-6">Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {studentsInClass.length > 0 ? (
                            studentsInClass.map((student) => (
                            <TableRow key={student.id} className={cn(attendance[student.id] === 'absent' && 'bg-destructive/10')}>
                                <TableCell>{student.rollNo}</TableCell>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell className="text-right pr-6">
                                <RadioGroup
                                    onValueChange={(status: string) => handleAttendanceChange(student.id, status as AttendanceStatus)}
                                    className="flex justify-end gap-6"
                                    value={attendance[student.id]}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="present" id={`present-${student.id}`} />
                                        <Label htmlFor={`present-${student.id}`} className="cursor-pointer">Present</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="absent" id={`absent-${student.id}`} />
                                        <Label htmlFor={`absent-${student.id}`} className="cursor-pointer">Absent</Label>
                                    </div>
                                </RadioGroup>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                No active students found in this class.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
                {studentsInClass.length > 0 && (
                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSaveAttendance}>Save Attendance</Button>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-[400px]">
                <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-headline text-foreground mb-2">
                    Select a class to begin
                </h3>
                <p className="text-muted-foreground max-w-xs">
                    Once you pick a date and class, the list of students will appear here for you to mark their attendance.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
