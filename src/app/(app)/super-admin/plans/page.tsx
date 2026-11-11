
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Edit, Trash, CheckCircle2, Crown, Calendar } from 'lucide-react'
import { useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import type { SubscriptionPlan, PlanType } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function PlansPage() {
  const firestore = useFirestore()
  const { user, isUserLoading } = useUser()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  
  const plansRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'plans') : null, [firestore, user])
  const { data: plans, isLoading } = useCollection<SubscriptionPlan>(plansRef)

  const [formData, setFormData] = useState({
    type: 'standard' as PlanType,
    monthlyPrice: 0,
    studentLimit: 100,
    features: ''
  })

  const handleOpenForm = (plan: SubscriptionPlan | null = null) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        type: plan.type || 'standard',
        monthlyPrice: plan.monthlyPrice,
        studentLimit: plan.studentLimit,
        features: plan.features.join(', ')
      })
    } else {
      setEditingPlan(null)
      setFormData({ 
        type: 'standard', 
        monthlyPrice: 0, 
        studentLimit: 100, 
        features: 'All Core Features, AI Assistant, SMS Support' 
      })
    }
    setIsFormOpen(true)
  }

  const handleSavePlan = () => {
    if (!firestore || !plansRef) return

    const planId = editingPlan ? editingPlan.id : doc(plansRef).id
    const planRef = doc(firestore, 'plans', planId)
    
    // Auto-generate name from type
    const autoName = formData.type.charAt(0).toUpperCase() + formData.type.slice(1) + ' Plan'

    const planData: SubscriptionPlan = {
      id: planId,
      name: autoName,
      type: formData.type,
      monthlyPrice: Number(formData.monthlyPrice),
      studentLimit: Number(formData.studentLimit),
      features: formData.features.split(',').map(f => f.trim()).filter(Boolean)
    }

    setDocumentNonBlocking(planRef, planData, { merge: true })
    toast({ title: editingPlan ? 'Plan Updated' : 'Plan Created', description: `${autoName} is now active.` })
    setIsFormOpen(false)
  }

  const handleDeletePlan = (id: string) => {
    if (!firestore) return
    const planRef = doc(firestore, 'plans', id)
    deleteDocumentNonBlocking(planRef)
    toast({ title: 'Plan Removed', variant: 'destructive' })
  }

  if (isUserLoading) return <div className="p-8 text-center animate-pulse">Loading Plans...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">SaaS Plans & Billing</h1>
          <p className="text-muted-foreground">Manage subscription tiers and pricing for schools.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="bg-primary text-primary-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Create Plan
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <p className="text-center col-span-3 py-12">Fetching plans from SaaS engine...</p>
        ) : plans?.length ? (
          plans.sort((a, b) => a.monthlyPrice - b.monthlyPrice).map(plan => (
            <Card key={plan.id} className={cn(
                "transition-all",
                plan.type === 'lifetime' ? "border-amber-400 bg-amber-50/10 shadow-md ring-1 ring-amber-400" : "hover:border-primary/50",
                plan.type === 'yearly' ? "border-blue-400 ring-1 ring-blue-400" : ""
            )}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant={plan.type === 'lifetime' ? 'default' : 'outline'} className={cn(
                      "mb-2 capitalize",
                      plan.type === 'lifetime' && "bg-amber-500 hover:bg-amber-600",
                      plan.type === 'yearly' && "border-blue-500 text-blue-600"
                  )}>
                    {plan.type === 'lifetime' && <Crown className="mr-1 h-3 w-3" />}
                    {plan.type === 'yearly' && <Calendar className="mr-1 h-3 w-3" />}
                    {plan.type} Plan
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(plan)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePlan(plan.id)}><Trash className="h-4 w-4" /></Button>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold font-headline">{plan.name}</CardTitle>
                <div className="text-3xl font-bold font-headline mt-2 text-primary">
                  ₹{plan.monthlyPrice.toLocaleString()}
                  <span className="text-sm text-muted-foreground font-normal">
                    {plan.type === 'lifetime' ? ' (One-time)' : (plan.type === 'yearly' ? '/yr' : '/mo')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Limit: {plan.studentLimit} Students
                </div>
                <div className="space-y-2">
                  {plan.features.map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
            <Card className="col-span-3 border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                    No active plans found. Please create your first subscription tier.
                </CardContent>
            </Card>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingPlan ? 'Edit SaaS Plan' : 'New Subscription Plan'}</DialogTitle>
            <DialogDescription>Configure pricing and limits for the school tenant.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Plan Type</Label>
              <Select value={formData.type} onValueChange={val => setFormData({...formData, type: val as PlanType})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (Monthly)</SelectItem>
                  <SelectItem value="standard">Standard (Monthly)</SelectItem>
                  <SelectItem value="premium">Premium (Monthly)</SelectItem>
                  <SelectItem value="yearly">Yearly (1 Year Plan)</SelectItem>
                  <SelectItem value="lifetime">Lifetime (One-time Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Price (₹)</Label>
                <Input 
                    type="number" 
                    value={formData.monthlyPrice} 
                    onChange={e => setFormData({...formData, monthlyPrice: Number(e.target.value)})} 
                />
              </div>
              <div className="grid gap-2">
                <Label>Student Limit</Label>
                <Input type="number" value={formData.studentLimit} onChange={e => setFormData({...formData, studentLimit: Number(e.target.value)})} />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Core Features (comma separated)</Label>
              <Input value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} placeholder="AI Reports, SMS, ID Cards..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} className="bg-primary text-primary-foreground">Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
