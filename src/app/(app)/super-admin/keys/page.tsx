'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { 
  Key, Copy, Plus, Check, Search, Trash2, RefreshCw, 
  Building2, CheckCircle2, XCircle, Clock, ShieldCheck, Filter, UserCheck, AlertTriangle 
} from 'lucide-react'
import type { ActivationKey, SubscriptionPlan, ActivationKeyStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

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

export default function SuperAdminKeysPage() {
  const firestore = useFirestore()
  const { user } = useUser()

  const keysRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'activation_keys') : null),
    [firestore, user]
  )
  const plansRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'plans') : null),
    [firestore, user]
  )

  const { data: keys, isLoading: keysLoading } = useCollection<ActivationKey>(keysRef)
  const { data: plans } = useCollection<SubscriptionPlan>(plansRef)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)

  // Form State
  const [keyString, setKeyString] = useState(generateKeyString())
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [durationDays, setDurationDays] = useState<number>(365)
  const [customerName, setCustomerName] = useState('')
  const [customStudentLimit, setCustomStudentLimit] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Metrics
  const metrics = useMemo(() => {
    if (!keys) return { total: 0, unused: 0, redeemed: 0, revoked: 0 }
    return {
      total: keys.length,
      unused: keys.filter(k => k.status === 'unused').length,
      redeemed: keys.filter(k => k.status === 'redeemed').length,
      revoked: keys.filter(k => k.status === 'revoked').length,
    }
  }, [keys])

  // Filtered List
  const filteredKeys = useMemo(() => {
    if (!keys) return []
    return keys.filter(k => {
      const matchesSearch =
        k.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.redeemedSchoolName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (k.redeemedByEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || k.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [keys, searchTerm, statusFilter])

  const handleOpenGenerateModal = () => {
    setKeyString(generateKeyString())
    setCustomerName('')
    setCustomStudentLimit('')
    if (plans && plans.length > 0) {
      setSelectedPlanId(plans[0].id)
    }
    setIsGenerateOpen(true)
  }

  const handleGenerateKey = async () => {
    if (!firestore || !selectedPlanId) {
      toast({ title: 'Validation Error', description: 'Please select a subscription plan.', variant: 'destructive' })
      return
    }

    const plan = plans?.find(p => p.id === selectedPlanId)
    if (!plan) {
      toast({ title: 'Plan Not Found', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    const newDocId = doc(collection(firestore, 'activation_keys')).id
    const studentLimit = customStudentLimit ? parseInt(customStudentLimit, 10) : plan.studentLimit

    const newKeyPayload: ActivationKey = {
      id: newDocId,
      key: keyString.trim().toUpperCase(),
      planId: plan.id,
      planName: plan.name,
      durationDays: Number(durationDays),
      studentLimit: isNaN(studentLimit) ? plan.studentLimit : studentLimit,
      status: 'unused',
      customerName: customerName.trim() || 'Unassigned Customer',
      createdAt: new Date().toISOString()
    }

    try {
      await setDocumentNonBlocking(doc(firestore, 'activation_keys', newDocId), newKeyPayload, { merge: true })
      toast({
        title: 'Key Generated Successfully',
        description: `Activation key ${newKeyPayload.key} created for ${newKeyPayload.customerName}.`
      })
      setIsGenerateOpen(false)
    } catch (err: any) {
      console.error('Failed to generate key:', err)
      toast({ title: 'Error', description: err.message || 'Failed to generate key.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyKey = (key: ActivationKey) => {
    navigator.clipboard.writeText(key.key)
    setCopiedKeyId(key.id)
    toast({ title: 'Key Copied', description: `${key.key} copied to clipboard.` })
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const handleRevokeKey = async (key: ActivationKey) => {
    if (!firestore) return
    try {
      await setDocumentNonBlocking(
        doc(firestore, 'activation_keys', key.id),
        { status: 'revoked' },
        { merge: true }
      )
      toast({ title: 'Key Revoked', description: `Key ${key.key} is now revoked.` })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const handleDeleteKey = async (key: ActivationKey) => {
    if (!firestore) return
    if (!confirm(`Are you sure you want to delete activation key ${key.key}?`)) return

    try {
      await deleteDocumentNonBlocking(doc(firestore, 'activation_keys', key.id))
      toast({ title: 'Key Deleted', description: `Key ${key.key} removed.` })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight uppercase flex items-center gap-2">
            <Key className="h-8 w-8 text-primary" /> Customer Activation Keys
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Issue and manage single-use license activation keys for new school customer registrations.
          </p>
        </div>

        <Button
          onClick={handleOpenGenerateModal}
          className="bg-primary hover:bg-primary/90 font-bold shadow-md gap-2"
        >
          <Plus className="h-4 w-4" /> Generate Activation Key
        </Button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Keys</p>
              <h3 className="text-2xl font-black font-headline mt-1">{metrics.total}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <Key className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available (Unused)</p>
              <h3 className="text-2xl font-black font-headline text-emerald-600 mt-1">{metrics.unused}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Redeemed</p>
              <h3 className="text-2xl font-black font-headline text-blue-600 mt-1">{metrics.redeemed}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revoked</p>
              <h3 className="text-2xl font-black font-headline text-rose-600 mt-1">{metrics.revoked}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-lg text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by key, customer, email, school..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-10">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
                <SelectItem value="redeemed">Redeemed</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Keys Data Table */}
      <Card className="border shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-lg font-headline tracking-tight">Issued Activation Keys</CardTitle>
          <CardDescription className="text-xs">
            Showing {filteredKeys.length} of {metrics.total} keys
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {keysLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
              Loading activation keys catalog...
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Key className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">No activation keys found.</p>
              <Button size="sm" variant="outline" onClick={handleOpenGenerateModal}>
                Generate First Activation Key
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b text-xs uppercase font-bold text-muted-foreground">
                  <tr>
                    <th className="p-4">Activation Key</th>
                    <th className="p-4">Customer Tag</th>
                    <th className="p-4">Plan & Limit</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4">Redemption Details</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredKeys.map(key => (
                    <tr key={key.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2.5 py-1 rounded border font-mono font-bold text-xs tracking-wider text-slate-800 dark:text-slate-100">
                            {key.key}
                          </code>
                          <button
                            onClick={() => handleCopyKey(key)}
                            title="Copy Key"
                            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedKeyId === key.id ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="p-4 font-semibold text-foreground">
                        {key.customerName || 'Unassigned'}
                      </td>

                      <td className="p-4">
                        <div>
                          <p className="font-bold text-xs">{key.planName}</p>
                          <p className="text-[11px] text-muted-foreground">{key.studentLimit} Students</p>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-xs">
                        {key.durationDays >= 3650 ? 'Lifetime' : `${key.durationDays} Days`}
                      </td>

                      <td className="p-4">
                        {key.status === 'unused' && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30">
                            Unused
                          </Badge>
                        )}
                        {key.status === 'redeemed' && (
                          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25 border-blue-500/30">
                            Redeemed
                          </Badge>
                        )}
                        {key.status === 'revoked' && (
                          <Badge variant="destructive">Revoked</Badge>
                        )}
                      </td>

                      <td className="p-4 text-xs text-muted-foreground font-mono">
                        {key.createdAt ? format(new Date(key.createdAt), 'MMM dd, yyyy') : '-'}
                      </td>

                      <td className="p-4 text-xs">
                        {key.status === 'redeemed' ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-muted-foreground" /> {key.redeemedSchoolName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{key.redeemedByEmail}</p>
                            {key.redeemedAt && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                {format(new Date(key.redeemedAt), 'MMM dd, HH:mm')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Not redeemed yet</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {key.status === 'unused' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRevokeKey(key)}
                              title="Revoke Key"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 px-2"
                            >
                              Revoke
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteKey(key)}
                            title="Delete Record"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Key Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-headline">
              <Key className="h-5 w-5 text-primary" /> Generate Activation Key
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create a cryptographic activation code for a new customer school setup.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Generated Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={keyString}
                  onChange={e => setKeyString(e.target.value.toUpperCase())}
                  className="font-mono font-bold tracking-wider text-center text-lg bg-muted/40 uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setKeyString(generateKeyString())}
                  title="Generate New Random Key"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer / School Name</Label>
              <Input
                placeholder="e.g. St. Xavier International Academy"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subscription Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans && plans.length > 0 ? (
                    plans.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.studentLimit} Students limit)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default_plan">Standard Plan (500 Students)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">License Validity Period</Label>
              <Select
                value={String(durationDays)}
                onValueChange={v => setDurationDays(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Days (Trial Period)</SelectItem>
                  <SelectItem value="90">90 Days (Quarterly License)</SelectItem>
                  <SelectItem value="180">180 Days (Semi-Annual)</SelectItem>
                  <SelectItem value="365">365 Days (1 Year Annual)</SelectItem>
                  <SelectItem value="730">730 Days (2 Years)</SelectItem>
                  <SelectItem value="3650">3650 Days (Lifetime License)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Custom Student Limit Override (Optional)
              </Label>
              <Input
                type="number"
                placeholder="Leave blank to use plan default"
                value={customStudentLimit}
                onChange={e => setCustomStudentLimit(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateKey}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 font-bold"
            >
              Save & Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
