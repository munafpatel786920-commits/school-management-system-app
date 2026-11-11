'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useFirestore } from '@/firebase'
import { collection, getDocs, writeBatch, query, where } from 'firebase/firestore'
import { useData } from '@/context/data-context'

export function MasterReset() {
  const [isOpen, setIsOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const firestore = useFirestore()
  const { userData } = useData()

  const handleReset = async () => {
    // 1. Strict Authorization check
    if (username.trim().toLowerCase() !== 'admin' || password !== 'reset123') {
      toast({
        variant: 'destructive',
        title: 'Authorization Failed',
        description: 'Incorrect master keys. Please check spelling.',
      })
      return
    }

    if (!firestore || !userData?.schoolId) {
      toast({
        variant: 'destructive',
        title: 'Session Error',
        description: 'Could not identify your school. Please refresh and try again.',
      })
      return
    }

    setIsResetting(true)
    toast({
      title: 'Initiating School Wipe',
      description: 'Clearing all operational data for your tenant...',
    })

    try {
      // Collections that are isolated by schoolId
      const collectionsToWipe = [
        'students', 
        'teachers', 
        'classes', 
        'attendance', 
        'teacher_attendance', 
        'expenses', 
        'dead_stock', 
        'fees',
        'users' // Filtered to keep current admin
      ];
      
      const mySchoolId = userData.schoolId;
      const batch = writeBatch(firestore);
      let totalDeleted = 0;

      for (const colPath of collectionsToWipe) {
        const colRef = collection(firestore, colPath);
        // CRITICAL: Filter by schoolId to satisfy security rules and ensure tenant isolation
        const q = query(colRef, where('schoolId', '==', mySchoolId));
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(docSnap => {
          // SAFETY: NEVER delete the current logged-in user record
          if (colPath === 'users' && docSnap.id === userData.id) {
            return;
          }
          batch.delete(docSnap.ref);
          totalDeleted++;
        });
      }

      if (totalDeleted > 0) {
        await batch.commit();
      }

      toast({
        title: 'Reset Successful',
        description: `Cleared ${totalDeleted} records. Your school is now fresh.`,
      })

      // Reset state and close
      setIsOpen(false);
      setUsername('');
      setPassword('');
      
      // Reload the app state
      setTimeout(() => {
        window.location.reload();
      }, 1500)

    } catch (error: any) {
      console.error("Master reset failed:", error);
      toast({
        variant: 'destructive',
        title: 'Reset Blocked',
        description: error.message || 'Permissions denied. Ensure you are the School Admin.',
      })
    } finally {
        setIsResetting(false);
    }
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5 shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline text-destructive flex items-center gap-2 text-xl">
          Dangerous: Reset All School Data
        </CardTitle>
        <CardDescription className="text-destructive/80 font-medium">
          This will permanently delete all students, teachers, classes, fees, and attendance records for <strong>this school only</strong>. Your admin account will remain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="font-bold px-8">
              Wipe My School Data
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-4 border-destructive">
            <DialogHeader>
              <DialogTitle className="text-destructive font-bold text-xl">Confirm Irreversible Deletion</DialogTitle>
              <DialogDescription className="font-semibold">
                Type 'admin' and the master password to confirm this action.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-username">Username</Label>
                <Input
                  id="reset-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  disabled={isResetting}
                  autoComplete="off"
                  className="border-destructive/30 focus-visible:ring-destructive"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-password">Master Password</Label>
                <Input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isResetting}
                  className="border-destructive/30 focus-visible:ring-destructive"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isResetting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
                {isResetting ? 'Processing Wipe...' : 'Confirm & Wipe Everything'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}