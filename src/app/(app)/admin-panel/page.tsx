
'use client'

import { useState } from 'react'
import { useAuth, useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc, setDoc, query, where } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { firebaseConfig } from '@/firebase/config'

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
import { PlusCircle, Edit, Trash, Loader2, ShieldCheck, Globe } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { UserForm, type UserFormData } from './user-form'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/context/data-context'

export default function AdminPanelPage() {
  const firestore = useFirestore();
  const { userData, activeSchoolId, isLoading: dataLoading } = useData();
  const { user: currentUser } = useUser();
  
  // Robust query that adapts to the current context (impersonation or direct login)
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !userData) return null;
    const colRef = collection(firestore, 'users');
    
    // If Super Admin is NOT impersonating, show ALL users (Global Registry)
    // This allows seeing legacy staff who might not have a schoolId yet
    if (userData.role === 'super_admin' && !activeSchoolId) return colRef;
    
    // If impersonating or a School Admin, filter strictly by the active schoolId
    if (activeSchoolId) {
        return query(colRef, where('schoolId', '==', activeSchoolId));
    }
    
    // Fallback: If no active school and not super admin, show nothing for safety
    return null;
  }, [firestore, userData, activeSchoolId]);

  const { data: users, isLoading: usersLoading } = useCollection<User>(usersQuery);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenForm = (user: User | null = null) => {
    setEditingUser(user);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setEditingUser(null);
    setIsFormOpen(false);
  }

  const handleAddUser = async (formData: UserFormData) => {
    if (!firestore || !userData) return;
    setIsSubmitting(true);

    let secondaryApp;
    try {
      const appName = `TempApp-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      const newUser = userCredential.user;

      await signOut(secondaryAuth);

      const userDocRef = doc(firestore, 'users', newUser.uid);
      await setDoc(userDocRef, {
        id: newUser.uid,
        email: formData.email,
        role: formData.role.toLowerCase(),
        schoolId: activeSchoolId || 'global',
        name: formData.email.split('@')[0]
      });

      toast({ title: 'Success', description: `Staff member ${formData.email} added successfully.` });
      handleCloseForm();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (userId: string, formData: Partial<UserFormData>) => {
    if (!firestore) return;
    setIsSubmitting(true);
    const userDocRef = doc(firestore, 'users', userId);
    try {
      await setDoc(userDocRef, { role: formData.role?.toLowerCase() }, { merge: true });
      toast({ title: 'Updated', description: "User permissions saved." });
      handleCloseForm();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteUser = (userId: string) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    deleteDocumentNonBlocking(userDocRef);
    toast({ 
      title: 'Removed', 
      description: "User record deleted. Access revoked.", 
      variant: 'destructive' 
    });
  };

  const isLoading = dataLoading || usersLoading;

  return (
    <div className="space-y-4">
      {userData?.role === 'super_admin' && !activeSchoolId && (
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Globe className="h-6 w-6" />
                <div>
                    <p className="font-bold">Global Registry Mode</p>
                    <p className="text-xs text-blue-100">You are viewing all staff across all schools and legacy records.</p>
                </div>
            </div>
            <ShieldCheck className="h-8 w-8 opacity-20" />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Staff Registry</CardTitle>
            <CardDescription>
              {activeSchoolId ? 'Manage staff accounts for this school.' : 'Manage all authorized system users.'}
            </CardDescription>
          </div>
          <Button size="sm" className="gap-1" onClick={() => handleOpenForm()}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Staff
            </span>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tenant ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Syncing Registry...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users && users.length > 0 ? (
                users.filter(u => u.id !== currentUser?.uid).map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                        <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'} className="capitalize">
                            {user.role?.replace('_', ' ')}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                        {user.schoolId || <span className="text-red-500 font-black">LEGACY / UNASSIGNED</span>}
                    </TableCell>
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
                              <AlertDialogTitle>Permanent Revocation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove this user's registry record. Access to the dashboard will be immediately revoked.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Confirm Deactivation</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                    No other staff records detected in this context.
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
            <DialogTitle className="font-headline">{editingUser ? 'Edit Staff Credentials' : 'New Staff Enrollment'}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Modify role permissions for this user." : 'Create a new login for this school instance.'}
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
    </div>
  )
}
