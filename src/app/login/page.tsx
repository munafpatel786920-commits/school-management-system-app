
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { useAuth, useUser, useFirestore, setDocumentNonBlocking } from '@/firebase'
import { doc, getDoc, writeBatch } from 'firebase/firestore'
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
import { ShieldCheck, AlertCircle, Loader2, LockKeyhole, BrainCircuit, Globe, Zap, HelpCircle, Key } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PlaceHolderImages } from '@/lib/placeholder-images'

const MASTER_EMAIL = 'patelmunaf90@gmail.com';
const APP_VERSION = "v4.0.5";

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState<boolean | null>(null)
  
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { isUserLoading } = useUser()
  const [isMounted, setIsMounted] = useState(false)

  const heroImage = PlaceHolderImages.find(img => img.id === 'login-hero')?.imageUrl || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'

  useEffect(() => {
    setIsMounted(true)
    const checkLock = async () => {
        if (!firestore) return
        try {
            const lockSnap = await getDoc(doc(firestore, 'admin_setup', 'lock'))
            setIsFirstTimeSetup(!lockSnap.exists())
        } catch (err) {
            console.error("Security verify failed:", err)
            setIsFirstTimeSetup(false) 
        }
    }
    checkLock()
  }, [firestore])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth || !firestore || isFirstTimeSetup === null) return

    setIsLoading(true)
    setErrorMsg(null)

    const cleanEmail = email.trim().toLowerCase()

    try {
      if (isFirstTimeSetup) {
        if (cleanEmail !== MASTER_EMAIL) {
            setErrorMsg('System initialization is restricted to the master email address.');
            setIsLoading(false);
            return;
        }

        let userCredential;
        try {
            userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password)
        } catch (signInErr: any) {
            if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
                userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password)
            } else {
                throw signInErr
            }
        }

        const newUser = userCredential.user
        const batch = writeBatch(firestore)
        
        batch.set(doc(firestore, 'users', newUser.uid), {
            id: newUser.uid,
            email: cleanEmail,
            role: 'super_admin',
            name: 'Master Administrator'
        }, { merge: true })
        
        batch.set(doc(firestore, 'admin_setup', 'lock'), {
            uid: newUser.uid,
            setupAt: new Date().toISOString()
        })
        
        await batch.commit()
        
        toast({ title: 'System Secured', description: 'Master credentials verified and lock engaged.' })
        router.push('/super-admin')
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password)
        const loggedInUser = userCredential.user
        
        const userDoc = await getDoc(doc(firestore, 'users', loggedInUser.uid))
        
        if (!userDoc.exists()) {
            if (cleanEmail === MASTER_EMAIL) {
                const batch = writeBatch(firestore);
                batch.set(doc(firestore, 'users', loggedInUser.uid), {
                    id: loggedInUser.uid,
                    email: cleanEmail,
                    role: 'super_admin',
                    name: 'Master Administrator'
                });
                await batch.commit();
                toast({ title: 'Master Access Restored' });
                router.push('/super-admin');
                return;
            }
            
            await signOut(auth)
            setErrorMsg('Security Alert: Your account is not recognized by the system.')
            setIsLoading(false)
            return
        }

        const userData = userDoc.data()
        let role = (userData.role as string)?.toLowerCase()
        if (role === 'admin') role = 'super_admin'

        if (userData.schoolId) {
            const schoolSnap = await getDoc(doc(firestore, 'schools', userData.schoolId))
            if (schoolSnap.exists()) {
                const schoolData = schoolSnap.data()

                if (schoolData.status === 'disabled') {
                    await signOut(auth)
                    setErrorMsg('Your school access has been suspended by Super Admin.');
                    setIsLoading(false)
                    return
                }

                if (schoolData.expiryDate) {
                    const expiryDateObj = new Date(schoolData.expiryDate)
                    const todayObj = new Date()
                    todayObj.setHours(0, 0, 0, 0)

                    if (expiryDateObj < todayObj || schoolData.status === 'expired') {
                        if (schoolData.status !== 'expired') {
                            await setDocumentNonBlocking(doc(firestore, 'schools', userData.schoolId), { status: 'expired' }, { merge: true })
                        }
                        await signOut(auth)
                        setErrorMsg(`License Expired: Your subscription expired on ${schoolData.expiryDate}. Please contact Super Admin or redeem a new activation key.`);
                        setIsLoading(false)
                        return
                    }
                }
            } else {
                await signOut(auth)
                setErrorMsg('Security Alert: School tenant record not found.');
                setIsLoading(false)
                return
            }
        }
        
        toast({ title: 'Success', description: `Authenticated as ${role.replace('_', ' ')}` })
        
        if (role === 'super_admin') {
            router.push('/super-admin')
        } else {
            router.push('/dashboard')
        }
      }

    } catch (error: any) {
      console.error("Login process error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrorMsg('Authentication failed. Please verify your credentials.')
      } else {
        setErrorMsg(error.message || 'An unexpected error occurred.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted || isUserLoading || isFirstTimeSetup === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col gap-4 bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-headline text-sm tracking-tight animate-pulse">Syncing Secure Gateway...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <Image 
            src={heroImage} 
            alt="School background" 
            fill 
            className="object-cover opacity-40"
            data-ai-hint="modern school"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        <div className="relative z-10 w-full flex flex-col justify-center px-12 text-white">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary rounded-lg">
                    <ShieldCheck className="h-8 w-8 text-primary-foreground" />
                </div>
                <h1 className="text-4xl font-black font-headline tracking-tighter uppercase">VidyaVerse Global</h1>
            </div>
            
            <h2 className="text-5xl font-bold font-headline mb-8 leading-tight">
                The Next-Gen SaaS Engine for <span className="text-primary">Modern Education.</span>
            </h2>

            <div className="grid gap-6">
                <div className="flex items-start gap-4">
                    <div className="mt-1 bg-white/10 p-2 rounded-md"><BrainCircuit className="h-5 w-5 text-primary" /></div>
                    <div>
                        <h3 className="font-bold text-lg">AI Document Engine</h3>
                        <p className="text-sm text-slate-300">Generate certificates, marksheets, and notices instantly with AI assistance.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="mt-1 bg-white/10 p-2 rounded-md"><Globe className="h-5 w-5 text-primary" /></div>
                    <div>
                        <h3 className="font-bold text-lg">Global Localization</h3>
                        <p className="text-sm text-slate-300">Multi-currency support and regional boards (CBSE, ICSE, British, IB) built-in.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="mt-1 bg-white/10 p-2 rounded-md"><Zap className="h-5 w-5 text-primary" /></div>
                    <div>
                        <h3 className="font-bold text-lg">Smart Session Rollover</h3>
                        <p className="text-sm text-slate-300">Automated student promotion and fee reset for new academic cycles.</p>
                    </div>
                </div>
            </div>

            <div className="mt-16 flex gap-4">
                <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                            #{i}
                        </div>
                    ))}
                </div>
                <div className="text-sm">
                    <p className="font-bold">Trusted by Global Institutions</p>
                    <p className="text-slate-400">Join the elite school management network.</p>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-background p-4 relative">
        <Card className="w-full max-w-sm border-2 shadow-2xl overflow-hidden relative">
            <div className={`h-1.5 w-full absolute top-0 ${isFirstTimeSetup ? 'bg-blue-500' : 'bg-accent'}`} />
            <CardHeader className="text-center pt-8">
            <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-full ${isFirstTimeSetup ? 'bg-blue-100' : 'bg-accent/10'}`}>
                    {isFirstTimeSetup ? <LockKeyhole className="h-10 w-10 text-blue-600" /> : <ShieldCheck className="h-10 w-10 text-accent" />}
                </div>
            </div>
            <CardTitle className="text-2xl font-headline tracking-tight">
                {isFirstTimeSetup ? 'System Bootstrapping' : 'VidyaVerse SaaS Portal'}
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground mt-1">
                {isFirstTimeSetup ? 'Establishing Root Identity' : 'Authorized Personnel Only'}
            </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
            <form onSubmit={handleLogin} className="grid gap-4">
                {errorMsg && (
                <Alert variant="destructive" className="py-2 border-2 border-destructive/20 bg-destructive/5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-[11px] font-semibold leading-tight">
                    {errorMsg}
                    </AlertDescription>
                </Alert>
                )}
                <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-muted-foreground ml-1 uppercase">Identity (Email)</Label>
                <Input
                    id="email"
                    type="email"
                    required
                    placeholder={isFirstTimeSetup ? MASTER_EMAIL : "your@email.com"}
                    value={email}
                    onChange={(e) => {
                    setEmail(e.target.value)
                    setErrorMsg(null)
                    }}
                    className="bg-muted/40 h-11 border-transparent focus:border-primary focus:ring-0 transition-all"
                    disabled={isLoading}
                />
                </div>
                
                <div className="grid gap-1.5">
                    <Label htmlFor="password" name="password" className="text-xs font-bold text-muted-foreground ml-1 uppercase">Security Key (Password)</Label>
                    <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => {
                        setPassword(e.target.value)
                        setErrorMsg(null)
                        }}
                        className="bg-muted/40 h-11 border-transparent focus:border-primary focus:ring-0 transition-all"
                        disabled={isLoading}
                    />
                </div>

                <Button type="submit" className={`w-full font-bold h-12 shadow-lg transition-all mt-2 ${isFirstTimeSetup ? 'bg-blue-600 hover:bg-blue-700' : 'bg-accent text-accent-foreground hover:bg-accent/90'}`} disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</> : (isFirstTimeSetup ? 'Initialize Master User' : 'Verify & Enter Portal')}
                </Button>

                {!isFirstTimeSetup && (
                  <div className="pt-3 border-t text-center space-y-2">
                    <p className="text-[11px] text-muted-foreground font-semibold">Have an Activation Key?</p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.push('/activate')}
                      className="w-full font-bold border-primary/40 text-primary hover:bg-primary/10 gap-2 h-10"
                    >
                      <Key className="h-4 w-4" /> Activate Customer License
                    </Button>
                  </div>
                )}

                <div className="relative mt-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
                    <div className="relative flex justify-center text-[9px] uppercase font-black tracking-tighter"><span className="bg-background px-2 text-muted-foreground">Version 4.0 Secure Node</span></div>
                </div>
            </form>
            </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <HelpCircle className="h-3.5 w-3.5" /> Technical Assistance
            </div>
            <div className="flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground font-medium relative z-50">
                <span>For updates or bug reports, contact:</span>
                <button 
                  onClick={() => { window.location.href = `mailto:${MASTER_EMAIL}`; }}
                  className="text-blue-600 hover:underline hover:text-blue-800 transition-all font-black py-1 px-2 relative z-[100] cursor-pointer"
                >
                  {MASTER_EMAIL}
                </button>
            </div>

            <div className="pt-4 border-t border-muted flex flex-col items-center justify-center gap-2">
                <div className="relative h-12 w-48 bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-lg border shadow-sm">
                    <Image 
                      src="/assets/aistudio/Gemini_Generated_Image_yik2auyik2auyik2_24a02baf.png" 
                      alt="Global Software Logo" 
                      fill 
                      className="object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                </div>
                <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                    © Copyright Global Software
                </p>
                <p className="text-[9px] font-semibold text-muted-foreground tracking-widest uppercase">
                    Empowering Your Digital World • {APP_VERSION}
                </p>
            </div>
        </div>
      </div>
    </div>
  )
}
