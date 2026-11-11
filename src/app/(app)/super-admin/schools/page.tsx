'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Edit, Trash, Infinity, Crown, Loader2, Wand2, ShieldCheck, Printer, FileText, Users, UsersRound, Clock, MessageSquare, Eye, CreditCard, CalendarDays, Wallet, ArrowUpRight, Key, Copy, Check } from 'lucide-react'
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking, useDoc } from '@/firebase'
import { collection, doc, setDoc, query, where, getDocs, limit, writeBatch } from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { firebaseConfig } from '@/firebase/config'
import type { School, SubscriptionPlan, Student, Teacher, SchoolClass, Expense, FeePayment } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { format, addYears, addMonths, differenceInDays } from 'date-fns'
import { cn, formatMoney } from '@/lib/utils'

function generateKeyString(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segment = (len: number) => {
    let result = ''
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  return `VV-${segment(4)}-${segment(4)}-${segment(4)}`
}
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
import { Progress } from '@/components/ui/progress'
import { generateSaaSReceiptHtml } from '@/lib/document-templates'

function SchoolLedgerDialog({ school, plan, onClose, onEdit }: { school: School, plan: SubscriptionPlan | undefined, onClose: () => void, onEdit: (s: School) => void }) {
    if (!school) return null;
    
    const daysRemaining = school.expiryDate ? differenceInDays(new Date(school.expiryDate), new Date()) : 0;
    const isExpiringSoon = daysRemaining < 7 && daysRemaining > 0;
    const isExpired = daysRemaining <= 0 && plan?.type !== 'lifetime';

    const calculateYield = () => {
        const price = plan?.monthlyPrice || 0;
        if (plan?.type === 'lifetime') return price;
        if (plan?.type === 'yearly') return price;
        return price * 12; 
    };

    return (
        <Dialog open={!!school} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl border-t-8 border-t-primary">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black font-headline flex items-center gap-2 uppercase">
                        <Wallet className="h-6 w-6 text-primary" />
                        Account Ledger: {school.name}
                    </DialogTitle>
                    <DialogDescription className="font-bold text-muted-foreground">
                        Comprehensive financial and subscription status overview.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-muted/30 border-none shadow-none p-4">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block">Account Balance</Label>
                            <div className="text-xl font-black text-primary">₹0.00</div>
                            <p className="text-[9px] text-muted-foreground mt-1">Prepaid Ledger Balance</p>
                        </Card>
                        <Card className={cn("border-none shadow-none p-4", isExpired ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700")}>
                            <Label className="text-[10px] font-black uppercase mb-2 block">Subscription Status</Label>
                            <div className="text-xl font-black uppercase tracking-tighter">{isExpired ? "Suspended" : "Active Node"}</div>
                            <p className="text-[9px] mt-1 font-bold">{isExpired ? "License Key Expired" : "Valid License Key"}</p>
                        </Card>
                        <Card className="bg-indigo-50 border-none shadow-none p-4 text-indigo-700">
                            <Label className="text-[10px] font-black uppercase mb-2 block">SMS Inventory</Label>
                            <div className="text-xl font-black">{school.smsBalance} Credits</div>
                            <p className="text-[9px] mt-1 font-bold">API Access Enabled</p>
                        </Card>
                    </div>

                    <Card className="border-2">
                        <CardHeader className="pb-3 border-b bg-muted/10">
                            <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                                <CreditCard className="h-4 w-4" /> Subscription Contract
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Current Plan Tier</p>
                                    <p className="text-lg font-black text-foreground">{plan?.name || 'Manual License'}</p>
                                </div>
                                <Badge className="bg-primary text-primary-foreground font-black px-4 py-1 h-fit">
                                    {plan?.type?.toUpperCase()}
                                </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 pt-2">
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase">
                                        {plan?.type === 'lifetime' ? 'Total Contract Value' : 'Annual Yield'}
                                    </p>
                                    <p className="text-base font-bold">₹{calculateYield().toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase">Billing Cycle</p>
                                    <p className="text-base font-bold capitalize">{plan?.type || 'Custom'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase">License Expiry</p>
                                    <p className={cn("text-base font-bold", isExpiringSoon && "text-amber-600", isExpired && "text-red-600")}>
                                        {plan?.type === 'lifetime' ? '∞ Never Expires' : format(new Date(school.expiryDate), 'MMMM dd, yyyy')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase">Days Remaining</p>
                                    <p className="text-base font-bold">{plan?.type === 'lifetime' ? 'N/A' : `${daysRemaining} Days`}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Live Resource Meter</Label>
                        <Card className="p-4 bg-slate-50 border-dashed border-2">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span>Student Data Objects</span>
                                        <span>{school.studentCount} / {plan?.studentLimit} Records</span>
                                    </div>
                                    <Progress value={((school.studentCount || 0) / (plan?.studentLimit || 1)) * 100} className="h-2" />
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase">
                                    <div className="flex items-center gap-1"><UsersRound className="h-3 w-3" /> {school.teacherCount} Staff Members</div>
                                    <div className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {school.smsBalance} SMS Used</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>Close Account View</Button>
                    <Button 
                        className="gap-2 font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        onClick={() => {
                            onClose();
                            onEdit(school);
                        }}
                    >
                        <ArrowUpRight className="h-4 w-4" /> Renew / Upgrade Plan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function ManageSchoolsPage() {
  const firestore = useFirestore()
  const { user, isUserLoading } = useUser()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSeeding, setIsSeeding] = useState<string | null>(null)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [viewingLedger, setViewingLedger] = useState<School | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ key: string; schoolName: string } | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  
  const schoolsRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'schools') : null, [firestore, user])
  const plansRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'plans') : null, [firestore, user])
  const configRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'admin_setup', 'config') : null, [firestore, user])
  
  const { data: schools, isLoading } = useCollection<School>(schoolsRef)
  const { data: plans } = useCollection<SubscriptionPlan>(plansRef)
  const { data: globalConfig } = useDoc<any>(configRef)

  const [formData, setFormData] = useState({
    name: '',
    adminEmail: '',
    adminPassword: '',
    planId: '',
    expiryDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
  })

  const handlePlanChange = (pId: string) => {
    const plan = plans?.find(p => p.id === pId);
    let newExpiry = formData.expiryDate;
    
    if (plan?.type === 'lifetime') {
        newExpiry = '2099-12-31';
    } else if (plan?.type === 'yearly') {
        newExpiry = format(addYears(new Date(), 1), 'yyyy-MM-dd');
    } else {
        newExpiry = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
    }
    
    setFormData({ ...formData, planId: pId, expiryDate: newExpiry });
  }

  const handlePrintSaaSReceipt = (school: School) => {
    const plan = plans?.find(p => p.id === school.planId);
    if (!plan) {
        toast({ variant: 'destructive', title: 'Plan Missing', description: 'Cannot generate receipt without plan info.' });
        return;
    }

    const platformName = globalConfig?.platformName || 'VidyaVerse Global';
    const html = generateSaaSReceiptHtml(school, plan, platformName);
    
    const win = window.open('', '', 'height=800,width=1000');
    if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 250);
    }
  }

  const handleSeedData = async (school: School) => {
    if (!firestore) return;
    setIsSeeding(school.id);
    
    toast({ title: "Generating Demo Data", description: `Populating ${school.name} with sample records...` });

    try {
        const batch = writeBatch(firestore);
        const schoolId = school.id;

        const classNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
        classNames.forEach(name => {
            const classRef = doc(collection(firestore, 'classes'));
            batch.set(classRef, {
                id: classRef.id,
                schoolId,
                name,
                sections: ["A", "B"]
            });
        });

        const sampleTeachers = [
            { name: "Rahul Verma", subject: "Mathematics", email: `rahul.${schoolId}@demo.com` },
            { name: "Sneha Sharma", subject: "Science", email: `sneha.${schoolId}@demo.com` },
            { name: "Amit Patel", subject: "English", email: `amit.${schoolId}@demo.com` }
        ];
        sampleTeachers.forEach(t => {
            const tRef = doc(collection(firestore, 'teachers'));
            batch.set(tRef, {
                id: tRef.id,
                schoolId,
                name: t.name,
                subject: t.subject,
                email: t.email,
                mobile: "9876543210",
                status: "Active",
                photoUrl: "https://picsum.photos/seed/teacher/200"
            });
        });

        for (let i = 1; i <= 15; i++) {
            const sRef = doc(collection(firestore, 'students'));
            batch.set(sRef, {
                id: sRef.id,
                schoolId,
                grNo: `G-${1000 + i}`,
                name: `Demo Student ${i}`,
                fatherName: "Sample Parent",
                motherName: "Sample Mother",
                dob: "2015-05-15",
                gender: "Male",
                address: "Demo Street",
                class: classNames[Math.floor(Math.random() * classNames.length)],
                section: "A",
                rollNo: i.toString(),
                mobile: "9988776655",
                status: "Active",
                totalFees: 25000,
                feesPaid: 5000,
                photoUrl: `https://picsum.photos/seed/student${i}/200`
            });
        }

        const schoolRef = doc(firestore, 'schools', schoolId);
        batch.update(schoolRef, { studentCount: 15, teacherCount: 3 });

        await batch.commit();
        toast({ title: "Demo Seeded!", description: `Successfully loaded sample data into ${school.name}.` });
    } catch (err: any) {
        console.error("Seeding failed:", err);
        toast({ variant: "destructive", title: "Seeding Failed", description: err.message });
    } finally {
        setIsSeeding(null);
    }
  };

  const filteredSchools = schools?.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenAdd = () => {
    setEditingSchool(null)
    setFormData({
      name: '',
      adminEmail: '',
      adminPassword: '',
      planId: plans && plans.length > 0 ? plans[0].id : '',
      expiryDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd')
    })
    setIsFormOpen(true)
  }

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school)
    setFormData({
      name: school.name,
      adminEmail: school.adminEmail || '', 
      adminPassword: '', 
      planId: school.planId,
      expiryDate: school.expiryDate
    })
    setIsFormOpen(true)
  }

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firestore || isSubmitting) return
    
    setIsSubmitting(true)

    try {
      if (editingSchool) {
        const schoolRef = doc(firestore, 'schools', editingSchool.id)
        updateDocumentNonBlocking(schoolRef, {
          name: formData.name,
          planId: formData.planId,
          expiryDate: formData.expiryDate,
          adminEmail: formData.adminEmail.toLowerCase().trim()
        })
        toast({ title: 'School Updated', description: `${formData.name} details saved.` })
      } else {
        const newSchoolId = doc(collection(firestore, 'schools')).id
        const schoolRef = doc(firestore, 'schools', newSchoolId)
        const cleanEmail = formData.adminEmail.toLowerCase().trim()
        const selectedPlan = plans?.find(p => p.id === formData.planId)

        // Auto Generate Activation Key
        const generatedKeyStr = generateKeyString()
        const keyDocRef = doc(collection(firestore, 'activation_keys'))
        const keyPayload = {
          id: keyDocRef.id,
          key: generatedKeyStr,
          planId: formData.planId || 'default',
          planName: selectedPlan?.name || 'Standard Plan',
          durationDays: selectedPlan?.type === 'lifetime' ? 3650 : (selectedPlan?.type === 'yearly' ? 365 : 30),
          studentLimit: selectedPlan?.studentLimit || 500,
          status: 'unused' as const,
          customerName: formData.name,
          createdAt: new Date().toISOString()
        }
        await setDoc(keyDocRef, keyPayload)
        
        const schoolData: School = {
          id: newSchoolId,
          name: formData.name,
          status: 'active',
          planId: formData.planId,
          expiryDate: formData.expiryDate,
          smsBalance: 100, 
          createdAt: new Date().toISOString(),
          adminEmail: cleanEmail,
          studentCount: 0,
          teacherCount: 0,
          activationKeyId: keyDocRef.id,
          activationDate: new Date().toISOString()
        }
        
        await setDoc(schoolRef, schoolData)

        const appName = `SchoolAdmin-${Date.now()}`
        const secondaryApp = initializeApp(firebaseConfig, appName)
        const secondaryAuth = getAuth(secondaryApp)

        try {
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, formData.adminPassword)
          const newUser = userCredential.user

          await signOut(secondaryAuth)
          await deleteApp(secondaryApp)

          const userDocRef = doc(firestore, 'users', newUser.uid)
          await setDoc(userDocRef, {
            id: newUser.uid,
            email: cleanEmail,
            role: 'school_admin',
            schoolId: newSchoolId,
            name: `${formData.name} Admin`
          })

          setNewlyCreatedKey({ key: generatedKeyStr, schoolName: formData.name })
          toast({ title: 'School Onboarded!', description: `${formData.name} is now live.` })
        } catch (authError: any) {
          await deleteApp(secondaryApp)

          if (authError.code === 'auth/email-already-in-use') {
            const q = query(collection(firestore, 'users'), where('email', '==', cleanEmail), limit(1))
            const existingSnap = await getDocs(q)
            if (!existingSnap.empty) {
              const uDoc = existingSnap.docs[0]
              await setDoc(doc(firestore, 'users', uDoc.id), {
                schoolId: newSchoolId,
                role: 'school_admin'
              }, { merge: true })
            }

            setNewlyCreatedKey({ key: generatedKeyStr, schoolName: formData.name })
            toast({ 
              title: 'School Onboarded & Linked!', 
              description: `Email ${cleanEmail} is already registered and has been linked to ${formData.name}.` 
            })
          } else {
            throw authError
          }
        }
      }
      setIsFormOpen(false)
    } catch (error: any) {
      console.error("School save error:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSchoolStatus = (school: School) => {
    if (!firestore) return
    const newStatus = school.status === 'active' ? 'disabled' : 'active'
    const ref = doc(firestore, 'schools', school.id)
    updateDocumentNonBlocking(ref, { status: newStatus })
    toast({ title: 'Status Updated', description: `${school.name} is now ${newStatus}.` })
  }

  const handleDeleteSchool = (schoolId: string) => {
    if (!firestore) return
    const ref = doc(firestore, 'schools', schoolId)
    deleteDocumentNonBlocking(ref)
    toast({ title: 'School Removed', variant: 'destructive' })
  }

  if (isUserLoading) return <div className="p-8 text-center animate-pulse">Establishing SaaS Gateway...</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline text-foreground">SaaS Tenant Portfolio</h1>
          <p className="text-muted-foreground">Manage active school licenses, users, and usage limits.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input 
            placeholder="Search school or email..." 
            className="max-w-[300px]" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="outline" onClick={() => window.location.href = '/super-admin/keys'} className="gap-2 font-bold border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
            <Key className="h-4 w-4 text-emerald-600" /> Keys Catalog
          </Button>
          <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground shadow-sm font-bold">
            <PlusCircle className="mr-2 h-4 w-4" /> Onboard New Institute
          </Button>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="py-4 pl-6">Institution Details</TableHead>
                <TableHead>License & Plan</TableHead>
                <TableHead>Enrollment Capacity</TableHead>
                <TableHead>Activity Status</TableHead>
                <TableHead className="text-right pr-6">Management Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse font-bold uppercase tracking-widest">Synchronizing Global Registry...</TableCell></TableRow>
              ) : filteredSchools?.length ? filteredSchools.map(school => {
                const plan = plans?.find(p => p.id === school.planId);
                const isLifetime = plan?.type === 'lifetime';
                const isYearly = plan?.type === 'yearly';
                const currentCount = school.studentCount || 0;
                const limitCount = plan?.studentLimit || 1;
                const usagePercent = Math.min(100, Math.round((currentCount / limitCount) * 100));

                return (
                  <TableRow key={school.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="font-black text-foreground text-sm uppercase tracking-tight">{school.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="h-4 text-[8px] bg-slate-50 text-slate-500">{school.id}</Badge>
                        <span className="truncate max-w-[150px]">{school.adminEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1.5">
                            <Badge variant="outline" className={cn(
                                "w-fit capitalize text-[10px] font-black", 
                                isLifetime && "border-amber-500 text-amber-700 bg-amber-50",
                                isYearly && "border-blue-500 text-blue-700 bg-blue-50"
                            )}>
                                {isLifetime ? <Crown className="mr-1 h-3 w-3" /> : <ShieldCheck className="mr-1 h-3 w-3" />}
                                {plan?.name || 'Loading Plan...'}
                            </Badge>
                            <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {isLifetime ? "Permanent Access" : `Expires ${format(new Date(school.expiryDate), 'MMM dd, yyyy')}`}
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                        <div className="space-y-1.5 pr-4">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                                <span className={cn(usagePercent > 90 ? "text-destructive" : "text-muted-foreground")}>
                                    <Users className="inline h-3 w-3 mr-1" />
                                    {currentCount} / {limitCount} Seats
                                </span>
                                <span>{usagePercent}%</span>
                            </div>
                            <Progress value={usagePercent} className={cn("h-1.5 bg-slate-100", usagePercent > 90 ? "[&>div]:bg-red-500" : "[&>div]:bg-primary")} />
                            <div className="text-[9px] text-muted-foreground font-bold flex items-center gap-3">
                                <span className="flex items-center gap-1"><UsersRound className="h-2.5 w-2.5" /> {school.teacherCount || 0} Staff</span>
                                <span className="flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5" /> {school.smsBalance} SMS</span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={school.status === 'active' ? 'default' : 'destructive'} className="capitalize h-5 text-[9px] font-black tracking-widest">
                        {school.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1.5">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            onClick={() => handlePrintSaaSReceipt(school)}
                            title="Print SaaS Invoice"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>

                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-primary border-primary/20 bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                            onClick={() => setViewingLedger(school)}
                            title="View Account Ledger"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            onClick={() => handleSeedData(school)}
                            disabled={isSeeding === school.id}
                            title="Seed Demo Records"
                        >
                          {isSeeding === school.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        </Button>

                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={cn(
                                "h-8 font-black text-[10px] uppercase transition-all shadow-sm",
                                school.status === 'active' ? "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-600 hover:text-white" : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white"
                            )}
                            onClick={() => toggleSchoolStatus(school)}
                        >
                          {school.status === 'active' ? 'Suspend' : 'Unsuspend'}
                        </Button>
                        
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleOpenEdit(school)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-4 border-destructive">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-destructive font-black uppercase text-xl">Wipe Tenant Node?</AlertDialogTitle>
                              <AlertDialogDescription className="font-bold text-slate-900">
                                This will permanently delete <strong>{school.name}</strong> and all associated data records. This action is terminal and cannot be reversed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="font-bold">Abort</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSchool(school.id)} className="bg-destructive text-white font-black">CONFIRM DELETION</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow><TableCell colSpan={5} className="text-center py-32 text-muted-foreground italic bg-slate-50/50">No operational school nodes detected.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md border-t-4 border-t-primary">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl uppercase tracking-tight">Institutional Onboarding</DialogTitle>
            <DialogDescription className="font-bold">
              {editingSchool ? 'Modify current tenant configuration.' : 'Provision a new isolated school instance.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSchool} className="space-y-5 pt-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">School Legal Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Saint Global Academy" className="border-2 font-bold" />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Administrator Identity (Email)</Label>
                    <Input type="email" required value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} placeholder="admin@institute.com" className="border-2 font-bold" />
                </div>
                {!editingSchool && (
                    <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initial Security Key</Label>
                        <Input type="password" required value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} placeholder="••••••••" className="border-2 font-bold" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subscription Tier</Label>
                <Select required value={formData.planId} onValueChange={handlePlanChange}>
                  <SelectTrigger className="border-2 font-bold"><SelectValue placeholder="Select Tier" /></SelectTrigger>
                  <SelectContent>
                    {plans?.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} ({plan.studentLimit} Seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Validity Lock</Label>
                <Input 
                    type="date" 
                    required 
                    value={formData.expiryDate} 
                    onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                    disabled={plans?.find(p => p.id === formData.planId)?.type === 'lifetime'}
                    className="border-2 font-bold"
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 bg-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all" disabled={isSubmitting}>
              {isSubmitting ? <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> ESTABLISHING NODE...</span> : (editingSchool ? 'SAVE PORTFOLIO' : 'COMMIT ONBOARDING')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {viewingLedger && (
          <SchoolLedgerDialog 
            school={viewingLedger} 
            plan={plans?.find(p => p.id === viewingLedger.planId)} 
            onClose={() => setViewingLedger(null)} 
            onEdit={handleOpenEdit}
          />
      )}

      {/* Activation Key Generated Dialog */}
      <Dialog open={!!newlyCreatedKey} onOpenChange={open => !open && setNewlyCreatedKey(null)}>
        <DialogContent className="sm:max-w-md border-t-4 border-t-emerald-500">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl flex items-center gap-2 text-emerald-600">
              <Key className="h-6 w-6" /> Activation Key Generated!
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Share this single-use key with {newlyCreatedKey?.schoolName} to activate their customer license.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="p-4 bg-muted/60 rounded-xl border text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Activation Code</span>
              <div className="flex items-center justify-center gap-2">
                <code className="text-2xl font-mono font-black tracking-wider text-emerald-600 dark:text-emerald-400">
                  {newlyCreatedKey?.key}
                </code>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              The customer can redeem this key anytime at <strong className="text-foreground">/activate</strong> to complete their account setup.
            </p>

            <Button
              className="w-full font-bold h-12 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg"
              onClick={() => {
                if (newlyCreatedKey) {
                  navigator.clipboard.writeText(newlyCreatedKey.key)
                  setKeyCopied(true)
                  toast({ title: 'Copied!', description: 'Activation Key copied to clipboard.' })
                  setTimeout(() => setKeyCopied(false), 2000)
                }
              }}
            >
              {keyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {keyCopied ? 'Copied to Clipboard!' : 'Copy Activation Key'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
