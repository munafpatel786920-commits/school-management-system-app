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

export default function TeacherAttendancePage() {
  const [date, setDate] = useState<Date | undefined>()
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const { teachers } = useData()
  const firestore = useFirestore();

  const teacherAttendanceColRef = useMemoFirebase(() => (firestore) ? collection(firestore, 'teacher_attendance') : null, [firestore]);

  useEffect(() => {
    setDate(new Date());
  }, []);

  const activeTeachers = useMemo(() => {
    return teachers.filter(
      (t) => t.status === 'Active'
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [teachers])


  const handleAttendanceChange = (teacherId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [teacherId]: status,
    }))
  }

  const handleSaveAttendance = () => {
    if (activeTeachers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No active teachers found.',
      })
      return
    }

    if(!teacherAttendanceColRef) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to database. Are you logged in?' });
        return;
    }

    const unMarkedTeachersCount = activeTeachers.filter(teacher => !attendance[teacher.id]).length;
    if (unMarkedTeachersCount > 0) {
       toast({
        variant: 'destructive',
        title: 'Incomplete Attendance',
        description: `Please mark attendance for all ${activeTeachers.length} teachers. ${unMarkedTeachersCount} remaining.`,
      })
      return
    }
    
    const attendanceDate = format(date || new Date(), 'yyyy-MM-dd');

    Object.entries(attendance).forEach(([teacherId, status]) => {
        addDocumentNonBlocking(teacherAttendanceColRef, {
            date: attendanceDate,
            teacherId,
            status,
        });
    });

    toast({
      title: 'Attendance Saved',
      description: `Teacher attendance for ${format(date || new Date(), 'PPP')} has been saved.`,
    })
  }

  const setAllAttendance = (status: AttendanceStatus) => {
    if(activeTeachers.length === 0) return;
    const newAttendance: Record<string, AttendanceStatus> = {};
    activeTeachers.forEach(teacher => {
      newAttendance[teacher.id] = status;
    });
    setAttendance(newAttendance);
    toast({
      title: `All Marked as ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      description: `All ${activeTeachers.length} teachers have been marked as ${status}.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Teacher Muster</CardTitle>
        <CardDescription>
          Select a date to mark teacher attendance.
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
        </div>

        <div className='space-y-4'>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium font-headline">
                    Teachers List ({activeTeachers.length})
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
                        <TableHead>Teacher Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right w-[250px] pr-6">Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {activeTeachers.length > 0 ? (
                        activeTeachers.map((teacher) => (
                        <TableRow key={teacher.id} className={cn(attendance[teacher.id] === 'absent' && 'bg-destructive/10')}>
                            <TableCell className="font-medium">{teacher.name}</TableCell>
                            <TableCell>{teacher.subject}</TableCell>
                            <TableCell className="text-right pr-6">
                            <RadioGroup
                                onValueChange={(status: string) => handleAttendanceChange(teacher.id, status as AttendanceStatus)}
                                className="flex justify-end gap-6"
                                value={attendance[teacher.id]}
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="present" id={`present-${teacher.id}`} />
                                    <Label htmlFor={`present-${teacher.id}`} className="cursor-pointer">Present</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="absent" id={`absent-${teacher.id}`} />
                                    <Label htmlFor={`absent-${teacher.id}`} className="cursor-pointer">Absent</Label>
                                </div>
                            </RadioGroup>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                            No active teachers found.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
            {activeTeachers.length > 0 && (
                <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveAttendance}>Save Attendance</Button>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
