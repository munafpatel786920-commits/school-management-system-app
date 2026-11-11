
'use client'

import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useFirestore } from '@/firebase'
import { doc, writeBatch } from 'firebase/firestore'
import { useData } from '@/context/data-context'
import { useSchoolProfile } from '@/context/school-profile-context'
import { RefreshCw, ArrowUpCircle, History, Check, X, AlertCircle, Coins } from 'lucide-react'
import { getNextClass, cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'

export function SessionManagement() {
  const [isProcessing, setIsSubmitting] = useState(false)
  const { students, userData } = useData()
  const { schoolProfile, updateSchoolProfile } = useSchoolProfile()
  const firestore = useFirestore()

  const [nextYear, setNextYear] = useState('')
  const [failedStudentIds, setFailedStudentIds] = useState<Set<string>>(new Set())

  const activeStudents = useMemo(() => {
    return students.filter(s => s.status === 'Active' || !s.status)
      .sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name))
  }, [students])

  const toggleStudentSelection = (studentId: string) => {
    const newSet = new Set(failedStudentIds)
    if (newSet.has(studentId)) {
      newSet.delete(studentId)
    } else {
      newSet.add(studentId)
    }
    setFailedStudentIds(newSet)
  }

  const handlePromoteStudents = async () => {
    if (!firestore || !activeStudents.length || !userData?.schoolId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Session data not ready.' });
        return;
    }

    setIsSubmitting(true)
    const batch = writeBatch(firestore)
    let processedCount = 0

    try {
      activeStudents.forEach((student) => {
        const isFailed = failedStudentIds.has(student.id)
        const studentRef = doc(firestore, 'students', student.id)

        // CRITICAL: Explicitly reset feesPaid to 0 for the new session
        const updates: any = {
          feesPaid: 0, 
        }

        if (!isFailed) {
          const nextLevel = getNextClass(student.class)
          if (nextLevel === 'COMPLETED') {
            updates.status = 'LC Issued'
          } else {
            updates.class = nextLevel
          }
        }

        batch.update(studentRef, updates)
        processedCount++
      })

      if (processedCount > 0) {
        await batch.commit()
        
        if (nextYear) {
            updateSchoolProfile({ academicYear: nextYear })
        }

        toast({
          title: 'Session Rollover Successful',
          description: `Processed ${processedCount} students. All fee records reset to 0 for ${nextYear}.`,
        })
        
        // Forced reload to clear all local caches
        setTimeout(() => {
            window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Promotion error:', error)
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1 border-blue-200 bg-blue-50/30 h-fit">
        <CardHeader>
          <CardTitle className="font-headline text-blue-700 flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Session Setup
          </CardTitle>
          <CardDescription className="text-blue-600/80">
            Define the new academic cycle and finalize student statuses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
              <Label htmlFor="next-year">New Academic Year</Label>
              <Input 
                  id="next-year" 
                  placeholder="e.g. 2026-2027" 
                  value={nextYear}
                  onChange={(e) => setNextYear(e.target.value)}
                  className="bg-white border-blue-200"
              />
              <p className="text-[10px] text-muted-foreground">Current: {schoolProfile?.academicYear || 'Not Set'}</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <Coins className="h-4 w-4" />
              Fee Reset Notice
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              रोलओवर के बाद सभी छात्रों की 'Paid Fees' 0 हो जाएगी। इसका मतलब है कि उनकी पूरी सालाना फीस (Total Fees) अब 'Due' दिखाई देगी। पुराने साल का बकाया खत्म हो जाएगा।
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2 h-12 shadow-lg" disabled={isProcessing || !nextYear}>
                <ArrowUpCircle className="h-4 w-4" />
                Start New Session
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-4 border-blue-500">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-blue-700">Final Confirmation</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3 font-medium">
                  <p>You are initializing session <strong>{nextYear}</strong>:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li className="text-green-700 font-bold">Promotion: {activeStudents.length - failedStudentIds.size} Students</li>
                    <li className="text-amber-700 font-bold">Repeating: {failedStudentIds.size} Students</li>
                    <li className="text-destructive font-black underline">Fees: ALL PAID RECORDS WILL BE WIPED (0)</li>
                  </ul>
                  <p className="text-xs italic text-muted-foreground">The app will refresh automatically after completion.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePromoteStudents} className="bg-blue-600">
                  Execute & Reset Fees
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg">Promotion Registry</CardTitle>
              <CardDescription>Uncheck students who failed or need to repeat.</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-green-600">
                <Check className="h-3 w-3" /> {activeStudents.length - failedStudentIds.size} Promoted
              </div>
              <div className="flex items-center gap-1.5 text-amber-600">
                <X className="h-3 w-3" /> {failedStudentIds.size} Repeating
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted/50 z-10">
                <tr className="text-[10px] uppercase font-black text-muted-foreground border-b">
                  <th className="p-3 text-left w-12">Pass?</th>
                  <th className="p-3 text-left">Student Name</th>
                  <th className="p-3 text-left">Current Class</th>
                  <th className="p-3 text-left">Next Class</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeStudents.length > 0 ? activeStudents.map((student) => {
                  const isFailed = failedStudentIds.has(student.id)
                  const nextClass = getNextClass(student.class)
                  
                  return (
                    <tr key={student.id} className={cn("hover:bg-muted/30 transition-colors", isFailed && "bg-amber-50/50")}>
                      <td className="p-3">
                        <Checkbox 
                          checked={!isFailed} 
                          onCheckedChange={() => toggleStudentSelection(student.id)} 
                          className="h-5 w-5 border-2 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-sm">{student.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{student.grNo}</div>
                      </td>
                      <td className="p-3 text-sm font-medium text-slate-500">{student.class}</td>
                      <td className="p-3">
                        <span className={cn(
                          "text-xs font-black px-2 py-1 rounded uppercase tracking-wider",
                          isFailed ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                        )}>
                          {isFailed ? `Stay in ${student.class}` : (nextClass === 'COMPLETED' ? 'Completed' : `Move to ${nextClass}`)}
                        </span>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-muted-foreground italic">
                      No active students found in registry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
