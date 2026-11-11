'use client'

import { useState, useMemo } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Coins, Wallet } from 'lucide-react'
import { useData } from '@/context/data-context'
import type { Student, School } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useSchoolProfile } from '@/context/school-profile-context'
import { format } from 'date-fns'
import { generateFeeReceiptForPayment } from '@/lib/document-templates'
import { formatMoney } from '@/lib/utils'

const handlePrint = (htmlContent: string) => {
  const printWindow = window.open('', '', 'height=800,width=600')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}

export default function FeesPage() {
  const { students, updateStudent, isLoading, addFeePayment } = useData()
  const { schoolProfile } = useSchoolProfile()
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false)
  const [amountToCollect, setAmountToCollect] = useState<number | ''>('')
  const [searchQuery, setSearchQuery] = useState('')

  const currency = schoolProfile?.currency || 'INR';
  const locale = schoolProfile?.locale || 'en-IN';

  const classes = useMemo(() => {
    const allClasses = students.map((s) => `${s.class} '${s.section}'`)
    return [...new Set(allClasses)].sort()
  }, [students])

  const filteredStudents = useMemo(() => {
    if (!selectedClass && !searchQuery) return []

    let list = students
    if (searchQuery) {
      list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.grNo.toLowerCase().includes(searchQuery.toLowerCase()))
    } else if (selectedClass) {
      const [cName, sQuote] = selectedClass.split(" '")
      const sect = sQuote.replace("'", '')
      list = list.filter(s => s.class === cName && s.section === sect)
    }

    return list.sort((a, b) => a.class.localeCompare(b.class) || parseInt(a.rollNo) - parseInt(b.rollNo))
  }, [selectedClass, searchQuery, students])

  const { totalCollected, totalPending } = useMemo(() => {
    return students.reduce((acc, s) => {
        acc.totalCollected += s.feesPaid;
        acc.totalPending += (s.totalFees - s.feesPaid);
        return acc;
    }, { totalCollected: 0, totalPending: 0 })
  }, [students])

  const handleCollectFee = () => {
    if (!selectedStudent || !amountToCollect || amountToCollect <= 0) return

    const amount = Number(amountToCollect)
    addFeePayment({
      studentId: selectedStudent.id,
      amount: amount,
      date: format(new Date(), 'yyyy-MM-dd'),
      receiptNo: Date.now().toString(),
    })

    updateStudent({ ...selectedStudent, feesPaid: selectedStudent.feesPaid + amount })
    toast({ title: 'Payment Received', description: `${formatMoney(amount, locale, currency)} recorded.` })

    const receiptHtml = generateFeeReceiptForPayment(selectedStudent, amount, schoolProfile as School)
    handlePrint(receiptHtml)

    setIsCollectFeeOpen(false)
    setSelectedStudent(null)
    setAmountToCollect('')
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Collected</CardTitle><Coins className="h-4 w-4 text-green-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold font-headline">{formatMoney(totalCollected, locale, currency)}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Outstanding</CardTitle><Wallet className="h-4 w-4 text-red-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold font-headline">{formatMoney(totalPending, locale, currency)}</div></CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="font-headline">Global Fee Management</CardTitle>
          <CardDescription>Multi-tenant financial operations with automated currency detection.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select onValueChange={setSelectedClass} value={selectedClass}>
              <SelectTrigger className="w-[240px]"><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Search by name or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[300px]" />
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Dues</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Scanning financial ledger...</TableCell></TableRow>
                ) : filteredStudents.map((s) => {
                  const pending = s.totalFees - s.feesPaid
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">{s.name}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney(s.totalFees, locale, currency)}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{formatMoney(s.feesPaid, locale, currency)}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">{formatMoney(pending, locale, currency)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedStudent(s); setIsCollectFeeOpen(true); }} disabled={pending <= 0}>Collect</Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCollectFeeOpen} onOpenChange={setIsCollectFeeOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedStudent && (
            <>
              <DialogHeader><DialogTitle>Receive Payment: {selectedStudent.name}</DialogTitle><DialogDescription>Current Balance: {formatMoney(selectedStudent.totalFees - selectedStudent.feesPaid, locale, currency)}</DialogDescription></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Amount</Label>
                  <Input type="number" value={amountToCollect} onChange={e => setAmountToCollect(e.target.value === '' ? '' : Number(e.target.value))} className="col-span-3" />
                </div>
              </div>
              <DialogFooter><Button onClick={handleCollectFee}>Generate Receipt & Save</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
