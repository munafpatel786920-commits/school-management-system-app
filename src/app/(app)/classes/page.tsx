'use client'

import { useState } from 'react'
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
import { PlusCircle, Edit, Trash } from 'lucide-react'
import type { SchoolClass } from '@/lib/types'
import { useData } from '@/context/data-context'
import { AddClassForm } from './add-class-form'
import { Badge } from '@/components/ui/badge'
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


export default function ClassesPage() {
  const { classes, addClass, updateClass, deleteClass, isLoading } = useData()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null)

  const handleOpenForm = (schoolClass: SchoolClass | null = null) => {
    setEditingClass(schoolClass);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setEditingClass(null);
    setIsFormOpen(false);
  }

  const handleAddClass = (newClassData: Omit<SchoolClass, 'id'>) => {
    addClass(newClassData);
    handleCloseForm()
  }

  const handleUpdateClass = (updatedClassData: SchoolClass) => {
    updateClass(updatedClassData);
    handleCloseForm();
  }

  const handleDeleteClass = (classId: string) => {
    deleteClass(classId);
    toast({
        title: 'Class Deleted',
        description: 'The class has been removed.',
        variant: 'destructive'
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Classes</CardTitle>
            <CardDescription>
              Manage school classes and sections.
            </CardDescription>
          </div>
            <Button size="sm" className="gap-1" onClick={() => handleOpenForm()}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Class
              </span>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Loading classes...
                  </TableCell>
                </TableRow>
              ) : classes.length > 0 ? (
                classes.map((schoolClass) => (
                  <TableRow key={schoolClass.id}>
                    <TableCell className="font-medium">{schoolClass.name}</TableCell>
                    <TableCell className="flex flex-wrap gap-1">
                      {schoolClass.sections.map(section => (
                          <Badge key={section} variant="secondary">{section}</Badge>
                      ))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(schoolClass)}>
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
                                This action cannot be undone. This will permanently delete the class.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteClass(schoolClass.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No classes found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-headline">{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                <DialogDescription>
                  {editingClass ? 'Update the class details below.' : 'Fill in the details below to add a new class.'}
                </DialogDescription>
              </DialogHeader>
              <AddClassForm
                schoolClass={editingClass}
                onClassAdded={handleAddClass}
                onClassUpdated={handleUpdateClass}
                onCancel={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
    </>
  )
}
