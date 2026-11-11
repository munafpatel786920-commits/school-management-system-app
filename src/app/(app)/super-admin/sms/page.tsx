'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageSquare, IndianRupee, History, RefreshCcw } from 'lucide-react'
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase'
import { collection, doc, query, orderBy, limit } from 'firebase/firestore'
import type { School, SmsLog } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default function SmsControlPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  const [isRechargeOpen, setIsRechargeOpen] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [creditsToAdd, setCreditsToAdd] = useState(500)
  
  const schoolsRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'schools') : null, [firestore, user])
  const logsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'sms_logs'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore, user])
  
  const { data: schools, isLoading: schoolsLoading } = useCollection<School>(schoolsRef)
  const { data: logs } = useCollection<SmsLog>(logsQuery)

  const handleRecharge = () => {
    if (!firestore || !selectedSchool) return
    
    const currentBalance = selectedSchool.smsBalance || 0
    const newBalance = currentBalance + Number(creditsToAdd)
    
    const schoolRef = doc(firestore, 'schools', selectedSchool.id)
    updateDocumentNonBlocking(schoolRef, { smsBalance: newBalance })
    
    toast({ title: 'Credits Added!', description: `Added ${creditsToAdd} SMS to ${selectedSchool.name}.` })
    setIsRechargeOpen(false)
    setSelectedSchool(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">SMS Control Center</h1>
        <p className="text-muted-foreground">Manage global SMS inventory and tenant balances.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gateway Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">Primary SMPP Connected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Global Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,45,200</div>
            <p className="text-xs text-muted-foreground">Remaining in master wallet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">842</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <IndianRupee className="h-5 w-5" /> School Balances
            </CardTitle>
            <CardDescription>Manage SMS credits for each school.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools?.map(school => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>
                      <Badge variant={school.smsBalance < 50 ? 'destructive' : 'secondary'}>
                        {school.smsBalance} SMS
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedSchool(school); setIsRechargeOpen(true); }}>
                        <RefreshCcw className="mr-2 h-3 w-3" /> Recharge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <History className="h-5 w-5" /> Recent Logs
            </CardTitle>
            <CardDescription>Latest SMS activities across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs?.length ? logs.map(log => (
                <div key={log.id} className="flex flex-col border-b pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{schools?.find(s => s.id === log.schoolId)?.name || 'Unknown'}</span>
                    <Badge variant="outline" className="text-[10px]">{log.status}</Badge>
                  </div>
                  <p className="text-xs line-clamp-1 italic">"{log.message}"</p>
                  <span className="text-[10px] text-muted-foreground mt-1">{format(new Date(log.timestamp), 'dd MMM HH:mm')} to {log.mobile}</span>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground text-sm italic">
                  No recent SMS logs found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add SMS Credits</DialogTitle>
            <DialogDescription>
              Increase SMS balance for <strong>{selectedSchool?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Credits to Add</Label>
              <Input type="number" value={creditsToAdd} onChange={e => setCreditsToAdd(Number(e.target.value))} />
              <p className="text-[10px] text-muted-foreground">Current Balance: {selectedSchool?.smsBalance} SMS</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRechargeOpen(false)}>Cancel</Button>
            <Button onClick={handleRecharge}>Add Credits</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
