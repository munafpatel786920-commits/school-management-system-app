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
  DialogDescription,
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
import type { Teacher } from '@/lib/types'
import { PlusCircle, Trash, Edit, Eye } from 'lucide-react'
import { AddTeacherForm } from './add-teacher-form'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { Input } from '@/components/ui/input'
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
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function TeacherDetails({ teacher }: { teacher: Teacher }) {
    return (
        <div className="grid gap-4">
            <div className="flex items-center gap-4">
                <Image
                    alt="Teacher image"
                    className="aspect-square rounded-md object-cover"
                    height="128"
                    src={teacher.photoUrl}
                    width="128"
                    data-ai-hint="teacher portrait"
                />
                <div className="grid gap-1">
                    <h2 className="text-xl font-bold font-headline">{teacher.name}</h2>
                    <p className="text-muted-foreground">{teacher.subject}</p>
                    <Badge variant={teacher.status === 'Active' ? 'default' : 'secondary'}>{teacher.status}</Badge>
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="grid gap-0.5">
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <p>{teacher.mobile}</p>
                </div>
                 <div className="grid gap-0.5">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{teacher.email}</p>
                </div>
            </div>
        </div>
    )
}

export default function TeachersPage() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, isLoading } = useData()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  const filteredTeachers = useMemo(() => {
    return teachers.filter(
      (teacher) => {
          const statusMatch = statusFilter === 'All' || teacher.status === statusFilter;
          const searchMatch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase());
          return statusMatch && searchMatch;
      }
    );
  }, [teachers, searchQuery, statusFilter]);

  const handleOpenForm = (teacher: Teacher | null = null) => {
    setEditingTeacher(teacher);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setEditingTeacher(null);
    setIsFormOpen(false);
  }

  const handleAddTeacher = (
    newTeacherData: Omit<Teacher, 'id'>
  ) => {
    const teacherPhotoPlaceholder =
      PlaceHolderImages.find((img) => img.id === 'teacher-photo-1')
        ?.imageUrl || 'https://picsum.photos/seed/picsum/64/64'
        
    const newTeacher = {
      ...newTeacherData,
      photoUrl: newTeacherData.photoUrl || teacherPhotoPlaceholder,
    }
    addTeacher(newTeacher);
    toast({
        title: 'Teacher Added',
        description: `${newTeacherData.name} has been added.`,
    })
    handleCloseForm()
  }

  const handleUpdateTeacher = (updatedTeacherData: Teacher) => {
    updateTeacher(updatedTeacherData);
    toast({
        title: 'Teacher Updated',
        description: `${updatedTeacherData.name}'s details have been updated.`,
    })
    handleCloseForm();
  }


  const handleDeleteTeacher = (teacherId: string) => {
    deleteTeacher(teacherId);
     toast({
      title: 'Teacher Deleted',
      description: 'The teacher has been removed from the list.',
      variant: 'destructive'
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Teachers</CardTitle>
            <CardDescription>
              Manage teacher profiles and information.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Teachers</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>
            <Input 
                placeholder="Search by Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
            />
            <Button size="sm" className="gap-1" onClick={() => handleOpenForm()}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Teacher
                </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Mobile</TableHead>
                <TableHead className="hidden md:table-cell">
                  Email
                </TableHead>
                <TableHead className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading teachers...
                  </TableCell>
                </TableRow>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                    <TableCell className="hidden sm:table-cell">
                        <Image
                        alt="Teacher image"
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={teacher.photoUrl}
                        width="64"
                        data-ai-hint="teacher portrait"
                        />
                    </TableCell>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>
                        {teacher.subject}
                    </TableCell>
                    <TableCell>
                        <Badge variant={teacher.status === 'Active' ? 'default' : 'secondary'}>{teacher.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {teacher.mobile}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                        {teacher.email}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setViewingTeacher(teacher)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(teacher)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-8 w-8">
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the teacher's record.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTeacher(teacher.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No teachers found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="font-headline">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
                  <DialogDescription>
                    {editingTeacher ? "Update the teacher's details below." : 'Fill in the details below to add a new teacher.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto p-1 pr-4">
                  <AddTeacherForm
                    teacher={editingTeacher}
                    onTeacherAdded={handleAddTeacher}
                    onTeacherUpdated={handleUpdateTeacher}
                    onCancel={handleCloseForm}
                  />
                </div>
            </DialogContent>
        </Dialog>

      <Dialog open={!!viewingTeacher} onOpenChange={(open) => !open && setViewingTeacher(null)}>
        <DialogContent className="sm:max-w-lg">
            {viewingTeacher && (
                <>
                <DialogHeader>
                    <DialogTitle className="font-headline">Teacher Details</DialogTitle>
                </DialogHeader>
                <TeacherDetails teacher={viewingTeacher} />
                </>
            )}
        </DialogContent>
      </Dialog>
    </>
  )
}
