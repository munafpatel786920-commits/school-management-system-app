'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { useAuth, useFirestore } from '@/firebase'
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { ShieldCheck, AlertCircle, Loader2, Key, CheckCircle2, ArrowRight, Building2, User, Lock, Sparkles, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { ActivationKey } from '@/lib/types'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { format, addDays } from 'date-fns'

export default function CustomerActivationPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [keyInput, setKeyInput] = useState('')
  const [validatedKey, setValidatedKey] = useState<ActivationKey | null>(null)
  
  // Registration Form State
  const [schoolName, setSchoolName] = useState('')
  const [educationBoard, setEducationBoard] = useState('CBSE')
  const [phone, setPhone] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [password, setPassword] = useState('')
  const [retypePassword, setRetypePassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()

  const heroImage = PlaceHolderImages.find(img => img.id === 'login-hero')?.imageUrl || 
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Step 1: Validate Key
  const handleValidateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firestore) return

    const cleanKey = keyInput.trim().toUpperCase()
    if (!cleanKey) {
      setErrorMsg('Please enter a valid activation key.')
      return
    }

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const q = query(collection(firestore, 'activation_keys'), where('key', '==', cleanKey))
      const querySnap = await getDocs(q)

      if (querySnap.empty) {
        setErrorMsg('Invalid activation key. Please verify your code and try again.')
        setIsLoading(false)
        return
      }

      const keyDoc = querySnap.docs[0]
      const keyData = { id: keyDoc.id, ...keyDoc.data() } as ActivationKey

      if (keyData.status === 'redeemed') {
        setErrorMsg('This activation key has already been redeemed.')
        setIsLoading(false)
        return
      }

      if (keyData.status === 'revoked') {
        setErrorMsg('This activation key has been revoked. Please contact support.')
        setIsLoading(false)
        return
      }

      setValidatedKey(keyData)
      setStep(2)
      toast({
        title: 'Key Verified!',
        description: `Unlocked ${keyData.planName} (${keyData.studentLimit} Students limit).`
      })
    } catch (err: any) {
      console.error('Key validation error:', err)
      setErrorMsg(err.message || 'Failed to validate activation key.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Complete Registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth || !firestore || !validatedKey) return

    setErrorMsg(null)

    // Form Validations
    if (!schoolName.trim()) {
      setErrorMsg('Please provide your School / Institution Name.')
      return
    }
    if (!adminName.trim()) {
      setErrorMsg('Please enter Administrator Full Name.')
      return
    }
    if (!adminEmail.trim()) {
      setErrorMsg('Please provide a valid Administrator Email.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }
    if (password !== retypePassword) {
      setErrorMsg('Passwords do not match. Please verify and retype your password.')
      return
    }

    setIsLoading(true)

    const cleanEmail = adminEmail.trim().toLowerCase()

    try {
      // 1. Create or Authenticate Firebase Auth user
      let newUser: any
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password)
        newUser = userCredential.user
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const signInCredential = await signInWithEmailAndPassword(auth, cleanEmail, password)
            newUser = signInCredential.user
          } catch (signInErr: any) {
            setErrorMsg('This email address is already registered. Please enter your existing password to link this activation key to your account.')
            setIsLoading(false)
            return
          }
        } else {
          throw authErr
        }
      }

      // 2. Calculate Expiry Date
      const now = new Date()
      const expiry = addDays(now, validatedKey.durationDays)
      const expiryStr = format(expiry, 'yyyy-MM-dd')

      // 3. Prepare Batch Writes
      const schoolId = doc(collection(firestore, 'schools')).id
      const batch = writeBatch(firestore)

      // Write School Document
      batch.set(doc(firestore, 'schools', schoolId), {
        id: schoolId,
        name: schoolName.trim(),
        status: 'active',
        planId: validatedKey.planId,
        expiryDate: expiryStr,
        smsBalance: 100,
        createdAt: now.toISOString(),
        adminEmail: cleanEmail,
        studentCount: 0,
        teacherCount: 0,
        activationKeyId: validatedKey.id,
        activationDate: now.toISOString(),
        phone: phone.trim() || '',
        educationBoard: educationBoard,
        academicYear: `${now.getFullYear()}-${now.getFullYear() + 1}`,
        currency: 'INR',
        currencySymbol: '₹',
        locale: 'en-IN'
      })

      // Write User Registry Document
      batch.set(doc(firestore, 'users', newUser.uid), {
        id: newUser.uid,
        email: cleanEmail,
        role: 'school_admin',
        name: adminName.trim(),
        schoolId: schoolId
      }, { merge: true })

      // Update Key Status to Redeemed
      batch.update(doc(firestore, 'activation_keys', validatedKey.id), {
        status: 'redeemed',
        redeemedByUid: newUser.uid,
        redeemedByEmail: cleanEmail,
        redeemedSchoolId: schoolId,
        redeemedSchoolName: schoolName.trim(),
        redeemedAt: now.toISOString()
      })

      await batch.commit()

      toast({
        title: 'Account Activated & Created!',
        description: `Welcome to VidyaVerse! Your license is active until ${expiryStr}.`
      })

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Registration error:', err)
      setErrorMsg(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Branding Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <Image 
          src={heroImage} 
          alt="School background" 
          fill 
          className="object-cover opacity-30"
          data-ai-hint="modern campus"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
        
        <div className="relative z-10 w-full flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-primary rounded-xl shadow-lg">
                <ShieldCheck className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-black font-headline tracking-tighter uppercase">VidyaVerse Global</h1>
            </div>
            
            <h2 className="text-4xl font-bold font-headline mb-4 leading-tight">
              Customer License & <span className="text-primary">School Activation</span>
            </h2>
            <p className="text-slate-300 text-sm max-w-md">
              Enter your one-time activation key to redeem your school&apos;s subscription license, configure administrator credentials, and launch your SaaS workspace.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/15 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" /> Instant Onboarding Guarantee
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Multi-Tenant Isolated Database Node
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Full Access to Modules & Student Records
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Automated Session Promotion & Fee Billing
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-4">
              <div className="relative h-8 w-32 bg-white/90 rounded px-1">
                <Image 
                  src="/assets/aistudio/Gemini_Generated_Image_yik2auyik2auyik2_24a02baf.png" 
                  alt="Global Software Logo" 
                  fill 
                  className="object-contain p-0.5"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                © Copyright Global Software
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-4 sm:p-8 relative">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/login')}
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
            </Button>
            
            <Badge variant="outline" className="text-[10px] font-mono">
              Step {step} of 2
            </Badge>
          </div>

          <Card className="border-2 shadow-xl overflow-hidden relative">
            <div className="h-1.5 w-full bg-primary" />
            
            <CardHeader className="pt-6 pb-4">
              <CardTitle className="text-2xl font-headline tracking-tight flex items-center gap-2">
                <Key className="h-6 w-6 text-primary" />
                {step === 1 ? 'Redeem Activation Key' : 'Create School Profile'}
              </CardTitle>
              <CardDescription className="text-xs">
                {step === 1 
                  ? 'Input your 16-character license key issued by VidyaVerse Super Admin.' 
                  : 'Configure your institution details and master login credentials.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-8">
              {errorMsg && (
                <Alert variant="destructive" className="mb-4 py-2 border border-destructive/20 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-semibold">{errorMsg}</AlertDescription>
                </Alert>
              )}

              {/* STEP 1: KEY VERIFICATION */}
              {step === 1 && (
                <form onSubmit={handleValidateKey} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Activation Key Code
                    </Label>
                    <Input
                      id="key"
                      placeholder="e.g. VV-ABCD-EFGH-JKLM"
                      value={keyInput}
                      onChange={e => {
                        setKeyInput(e.target.value.toUpperCase())
                        setErrorMsg(null)
                      }}
                      className="font-mono text-center text-lg tracking-wider font-bold h-12 uppercase bg-muted/30"
                      disabled={isLoading}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Format: VV-XXXX-XXXX-XXXX. Activation keys are single-use.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !keyInput.trim()}
                    className="w-full font-bold h-12 gap-2 shadow-lg bg-primary hover:bg-primary/90 mt-2"
                  >
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Validating Key...</>
                    ) : (
                      <>Verify & Continue <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </form>
              )}

              {/* STEP 2: REGISTRATION FORM */}
              {step === 2 && validatedKey && (
                <form onSubmit={handleCompleteRegistration} className="space-y-4">
                  {/* Unlocked Plan Banner */}
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Unlocked License</span>
                      <p className="font-bold text-sm text-foreground">{validatedKey.planName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Validity</span>
                      <p className="font-mono text-xs font-bold">{validatedKey.durationDays >= 3650 ? 'Lifetime' : `${validatedKey.durationDays} Days`}</p>
                    </div>
                  </div>

                  {/* School Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b pb-1">
                      <Building2 className="h-3.5 w-3.5" /> Institution Details
                    </h4>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="schoolName" className="text-xs font-semibold">School / Institution Name *</Label>
                        <Input
                          id="schoolName"
                          placeholder="e.g. Cambridge International School"
                          value={schoolName}
                          onChange={e => setSchoolName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="board" className="text-xs font-semibold">Education Board</Label>
                        <Select value={educationBoard} onValueChange={setEducationBoard}>
                          <SelectTrigger id="board">
                            <SelectValue placeholder="Board" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CBSE">CBSE</SelectItem>
                            <SelectItem value="ICSE">ICSE</SelectItem>
                            <SelectItem value="State Board">State Board</SelectItem>
                            <SelectItem value="IB">IB International</SelectItem>
                            <SelectItem value="Cambridge">Cambridge IGCSE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="phone" className="text-xs font-semibold">Contact Phone</Label>
                        <Input
                          id="phone"
                          placeholder="+91 9876543210"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Account Admin Credentials */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b pb-1">
                      <User className="h-3.5 w-3.5" /> Administrator Credentials
                    </h4>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="adminName" className="text-xs font-semibold">Administrator Full Name *</Label>
                        <Input
                          id="adminName"
                          placeholder="e.g. Dr. Rajesh Sharma"
                          value={adminName}
                          onChange={e => setAdminName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="adminEmail" className="text-xs font-semibold">Login Email Identity *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="admin@schoolname.edu"
                          value={adminEmail}
                          onChange={e => setAdminEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="pass" className="text-xs font-semibold">Password *</Label>
                          <Input
                            id="pass"
                            type="password"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="retype" className="text-xs font-semibold">Retype Password *</Label>
                          <Input
                            id="retype"
                            type="password"
                            placeholder="Re-enter password"
                            value={retypePassword}
                            onChange={e => setRetypePassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={isLoading}
                    >
                      Change Key
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 font-bold h-11 bg-primary hover:bg-primary/90 shadow-md"
                    >
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating Account...</>
                      ) : (
                        'Complete Registration & Activate'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
