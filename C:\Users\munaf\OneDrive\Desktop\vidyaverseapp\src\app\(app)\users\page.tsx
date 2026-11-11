
'use client'

import { useState, useMemo } from 'react'
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'

import type { User } from '@/lib/types'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
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
import { PlusCircle, Edit, Trash } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { UserForm, type UserFormData } from './user-form'
import { Badge } from '@/components/ui/badge'

export default function UserManagementPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  
  const usersColRef = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading } = useCollection<User>(usersColRef);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleOpenForm = (user: User | null = null) => {
    setEditingUser(user);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setEditingUser(null);
    setIsFormOpen(false);
  }

  const handleAddUser = async (formData: UserFormData) => {
    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firebase not initialized.' });
      return;
    }

    try {
      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newUser = userCredential.user;

      // Step 2: Create user document in Firestore
      const userDocRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userDocRef, {
        id: newUser.uid,
        email: formData.email,
        role: formData.role,
      });

      toast({ title: 'User Created', description: `User ${formData.email} has been created with the role ${formData.role}.` });
      handleCloseForm();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({ variant: 'destructive', title: 'User Creation Failed', description: error.message });
    }
  };

  const handleUpdateUser = async (userId: string, formData: Partial<UserFormData>) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    try {
      await setDoc(userDocRef, { role: formData.role }, { merge: true });
      toast({ title: 'User Updated', description: "The user's role has been updated." });
      handleCloseForm();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    try {
      // This only deletes the Firestore record, not the Auth user.
      // This effectively deactivates the user in the app.
      await deleteDoc(userDocRef);
      toast({ title: 'User Deleted', description: "The user's record has been removed.", variant: 'destructive' });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">User Management</CardTitle>
            <CardDescription>
              Add, edit, or remove users for your school.
            </CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={() => handleOpenForm()}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add User
            </span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users && users.length > 0 ? (
                users.filter(u => u.role !== 'admin').map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(user)}>
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
                                This will delete the user's record from the app, but their login will still exist in Firebase Authentication. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
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
                    No users found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Update the user's role." : 'Create a new user and assign them a role.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={editingUser}
            onFormSubmit={async (data) => {
              if (editingUser) {
                await handleUpdateUser(editingUser.id, data);
              } else {
                await handleAddUser(data as UserFormData);
              }
            }}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
