'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { useAuth, useFirestore } from '@/firebase'
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { BookOpenCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firebase is not initialized.',
      })
      return
    }
    setIsLoading(true)

    try {
      // 1. Try to sign in first
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      
      toast({
        title: 'Login Successful',
        description: `Welcome back! Redirecting...`,
      })
      router.push('/dashboard')

    } catch (error: any) {
      // 3. Handle login errors, specifically 'user not found' which is now 'auth/invalid-credential'
      if (error.code === 'auth/invalid-credential') {
        // User not found or wrong password. Try to create the first Admin.
        await createFirstAdmin()
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const createFirstAdmin = async () => {
    if (!firestore || !auth) return

    // Check if the admin_setup lock exists
    const adminSetupRef = doc(firestore, 'admin_setup', 'lock');
    
    try {
        const adminSetupDoc = await getDoc(adminSetupRef);

        if (adminSetupDoc.exists()) {
          // An admin exists. So the login credentials were just wrong.
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Invalid credentials. Please check your email and password.',
          })
          return
        }

        // NO admin exists. Let's create the very first one.
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )
        const newUser = userCredential.user

        // Use a write batch to make the operation atomic
        const batch = writeBatch(firestore);

        // Create user document in Firestore with 'admin' role
        const userDocRef = doc(firestore, 'users', newUser.uid)
        batch.set(userDocRef, {
          id: newUser.uid,
          email: newUser.email,
          role: 'admin',
        });
        
        // Create the lock document
        batch.set(adminSetupRef, {
            uid: newUser.uid,
            createdAt: new Date(),
        });

        await batch.commit();

        toast({
          title: 'Admin Account Created!',
          description: 'You are the first user. Welcome! Redirecting to the Dashboard...',
        })
        router.push('/dashboard')

    } catch (createError: any) {
        toast({
            variant: 'destructive',
            title: 'Setup Failed',
            description: createError.message || 'An error occurred during initial setup.',
        });
        console.error("Error in createFirstAdmin:", createError);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BookOpenCheck className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-headline">
            VidyaVerse Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Login or Sign Up'}
            </Button>
             <p className="px-8 text-center text-sm text-muted-foreground">
                If this is the first time running the app, entering an email and password will create the Admin account.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
