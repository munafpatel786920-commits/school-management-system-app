'use client'

import Image from 'next/image'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useData } from '@/context/data-context'
import type { Student, SubscriptionPlan } from '@/lib/types'
import { PlusCircle, Edit, Eye, ShieldAlert, Crown, Trash2 } from 'lucide-react'
import { AddStudentForm, type StudentFormData } from './add-student-form'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { useSchoolProfile } from '@/context/school-profile-context'
import { cn, getRegionLabels } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function StudentDetails({ student, locale }: { student: Student, locale: string }) {
  const labels = getRegionLabels(locale);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-4">
        <Image
          alt="Student image"
          className="aspect-square rounded-md object-cover"
          height="128"
          src={student.photoUrl}
          width="128"
          data-ai-hint="student portrait"
        />
        <div className="grid gap-1">
          <h2 className="text-xl font-bold font-headline">{student.name}</h2>
          <p className="text-muted-foreground">
            {student.class} '{student.section}'
          </p>
          <Badge
            variant={student.status === 'Active' ? 'default' : 'secondary'}
          >
            {student.status}
          </Badge>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
        <div className="grid gap-0.5">
          <p className="text-sm text-muted-foreground">Roll No.</p>
          <p>{student.rollNo}</p>
        </div>
        <div className="grid gap-0.5">
          <p className="text-sm text-muted-foreground">{labels.idLabel}</p>
          <p>{student.grNo}</p>
        </div>
        <div className="grid gap-0.5">
          <p className="text-sm text-muted-foreground">Father's Name</p>
          <p>{student.fatherName}</p>
        </div>
        <div className="grid gap-0.5">
          <p className="text-sm text-muted-foreground">Mother's Name</p>
          <p>{student.motherName}</p>
        </div>
        <div className="grid gap-0.5">
          <p className="text-sm text-muted-foreground">Date of Birth</p>
          <p>{new Date(student.dob).toLocaleDateString(locale)}</p>
        </div>
        <div className="grid gap-0.5">
          <p className="text-sm text-muted-foreground">Gender</p>
          <p>{student.gender}</p>
        </div>
        <div className="grid gap-0.5">
          <p className="text-sm text-muted-foreground">Mobile</p>
          <p>{student.mobile}</p>
        </div>
        <div className="grid gap-0.5">
          <p className="text-sm text-muted-foreground">{labels.nationalId}</p>
          <p>{student.aadhaar || 'N/A'}</p>
        </div>
        <div className="grid gap-0.5 md:col-span-2">
          <p className="text-sm text-muted-foreground">Address</p>
          <p>{student.address}</p>
        </div>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const { students, addStudent, updateStudent, deleteStudent, isLoading } = useData()
  const { schoolProfile } = useSchoolProfile()
  const firestore = useFirestore()
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter] = useState('Active')
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  
  const locale = schoolProfile?.locale || 'en-IN';
  const labels = getRegionLabels(locale);

  const plansRef = useMemoFirebase(() => firestore ? collection(firestore, 'plans') : null, [firestore]);
  const { data: plans } = useCollection<SubscriptionPlan>(plansRef);
  const activePlan = plans?.find(p => p.id === schoolProfile?.planId);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      let statusMatch
      if (statusFilter === 'Active') {
        statusMatch = student.status === 'Active' || !student.status
      } else {
        statusMatch = statusFilter === 'All' || student.status === statusFilter
      }

      const searchMatch =
        searchQuery === '' ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.rollNo && student.rollNo.toString().includes(searchQuery)) ||
        student.grNo.toLowerCase().includes(searchQuery.toLowerCase())

      return statusMatch && searchMatch
    })
  }, [students, searchQuery, statusFilter])

  const usagePercent = useMemo(() => {
    if (!activePlan) return 0;
    return Math.round((students.length / activePlan.studentLimit) * 100);
  }, [students, activePlan]);

  const handleOpenForm = (student: Student | null = null) => {
    if (!student && activePlan && students.length >= activePlan.studentLimit) {
        toast({
            variant: 'destructive',
            title: 'Admission Limit Reached',
            description: `Your current plan allows max ${activePlan.studentLimit} students. Please upgrade.`,
        });
        return;
    }
    setEditingStudent(student)
    setIsFormOpen(true)
  }

  const handleAddStudent = (newStudentData: StudentFormData) => {
    const studentPhotoPlaceholder = 'https://picsum.photos/seed/picsum/64/64'
    const newStudent = {
      ...newStudentData,
      photoUrl: newStudentData.photoUrl || studentPhotoPlaceholder,
      rollNo: '',
      status: 'Active' as const,
      feesPaid: 0,
    }
    addStudent(newStudent);
    toast({ title: 'Student Enrolled', description: `${newStudent.name} successfully added to registry.` })
    setIsFormOpen(false)
  }

  const handleUpdateStudent = (updatedStudent: Student) => {
    updateStudent(updatedStudent);
    toast({ title: 'Profile Updated', description: `${updatedStudent.name}'s records have been saved.` })
    setIsFormOpen(false)
  }

  const handleDeleteStudent = (id: string) => {
    deleteStudent(id);
    toast({
      title: 'Student Deleted',
      description: 'The student record has been removed from the system.',
      variant: 'destructive'
    })
  }

  return (
    <div className="space-y-4">
      {activePlan && (
        <Card className="bg-muted/30 border-dashed">
            <CardContent className="py-3 flex items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <Crown className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan Capacity</p>
                        <p className="text-sm font-bold">{students.length} / {activePlan.studentLimit} Enrolled</p>
                    </div>
                </div>
                <div className="flex-1 max-w-xs space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                        <span>Utilization</span>
                        <span className={usagePercent > 90 ? "text-destructive" : ""}>{usagePercent}%</span>
                    </div>
                    <Progress value={usagePercent} className={cn("h-1.5", usagePercent > 90 && "[&>div]:bg-red-500")} />
                </div>
                {usagePercent > 90 && (
                    <div className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase animate-pulse">
                        <ShieldAlert className="h-3 w-3" /> Seats almost full
                    </div>
                )}
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="font-headline">Student Registry</CardTitle>
            <CardDescription>Official enrollment records localized for {labels.idLabel}.</CardDescription>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Input
              placeholder={`Search by Name or ${labels.idLabel}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button size="sm" onClick={() => handleOpenForm()}>
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Student
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>{labels.idLabel}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={6} className="h-24 text-center">Scanning database shards...</TableCell></TableRow>
              ) : filteredStudents.length > 0 ? (
                 filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                    <TableCell>
                        <Image alt="img" className="aspect-square rounded-md object-cover border" height="40" src={student.photoUrl} width="40" />
                    </TableCell>
                    <TableCell className="font-bold">{student.name}</TableCell>
                    <TableCell>{student.class} '{student.section}'</TableCell>
                    <TableCell className="font-mono text-xs">{student.grNo}</TableCell>
                    <TableCell><Badge variant={student.status === 'Active' ? 'default' : 'destructive'}>{student.status || 'Active'}</Badge></TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setViewingStudent(student)} title="View Details"><Eye className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(student)} title="Edit Record"><Edit className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Delete Student">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Student from Registry?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete <strong>{student.name}</strong> and all associated academic records. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteStudent(student.id)} className="bg-destructive text-destructive-foreground">
                                    Delete Permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="h-24 text-center italic text-muted-foreground">No records matching your search criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingStudent ? 'Update Profile' : 'Student Enrollment Form'}</DialogTitle>
          </DialogHeader>
          <AddStudentForm
            student={editingStudent}
            onStudentAdded={handleAddStudent}
            onStudentUpdated={handleUpdateStudent}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewingStudent && (
            <>
              <DialogHeader><DialogTitle className="font-headline">Academic Profile</DialogTitle></DialogHeader>
              <StudentDetails student={viewingStudent} locale={locale} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
