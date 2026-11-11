'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { Globe, CreditCard, MessageSquare, AlertTriangle, Zap, ShieldCheck, TrendingUp, Megaphone, Plus, Trash2, Clock, Server, Database, Activity, PieChart as PieIcon, School, Key } from 'lucide-react'
import { useMemo } from 'react'
import type { School as SchoolType, SubscriptionPlan, SmsLog, Announcement } from '@/lib/types'
import { Progress } from '@/components/ui/progress'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Pie, PieChart, Cell, Legend } from 'recharts'
import { format, subMonths, startOfMonth, isSameMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'];

export default function SuperAdminDashboard() {
  const firestore = useFirestore()
  const { user } = useUser()
  
  const schoolsRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'schools') : null, [firestore, user])
  const plansRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'plans') : null, [firestore, user])
  const logsRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'sms_logs') : null, [firestore, user])
  const annRef = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'platform_announcements') : null, [firestore, user])
  
  const { data: schools, isLoading: schoolsLoading } = useCollection<SchoolType>(schoolsRef)
  const { data: plans } = useCollection<SubscriptionPlan>(plansRef)
  const { data: allLogs } = useCollection<SmsLog>(logsRef)
  const { data: announcements } = useCollection<Announcement>(annRef)

  const [isAnnOpen, setIsAnnOpen] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', message: '', priority: 'medium' as any })

  const { stats, growthData, planStats, riskTenants } = useMemo(() => {
    const baseStats = { 
        total: 0, 
        active: 0, 
        expired: 0, 
        revenue: 0, 
        totalSms: 0,
    }
    
    const planBreakdown: Record<string, number> = {}
    const riskSchools: any[] = []

    const last6Months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)))
    const growth = last6Months.map(month => ({
        name: format(month, 'MMM'),
        count: 0,
        date: month
    }))

    if (schools) {
      schools.forEach(s => {
        baseStats.total++
        if (s.status === 'active') baseStats.active++
        if (s.status === 'expired') baseStats.expired++
        
        const plan = plans?.find(p => p.id === s.planId)
        if (plan) {
            // Calculate Monthly Recurring Revenue (MRR)
            let monthlyImpact = plan.monthlyPrice;
            if (plan.type === 'yearly') monthlyImpact = plan.monthlyPrice / 12;
            if (plan.type === 'lifetime') monthlyImpact = 0; // Lifetime is one-time sum, not monthly recurring
            
            baseStats.revenue += monthlyImpact;
            planBreakdown[plan.name] = (planBreakdown[plan.name] || 0) + 1

            // Risk Assessment: Schools near student limit
            const usagePercent = ((s.studentCount || 0) / plan.studentLimit) * 100
            if (usagePercent > 90) {
                riskSchools.push({ name: s.name, usage: Math.round(usagePercent), limit: plan.studentLimit })
            }
        }

        const creationDate = new Date(s.createdAt)
        growth.forEach(bucket => {
            if (isSameMonth(creationDate, bucket.date)) {
                bucket.count++
            }
        })
      })
    }

    const planChartData = Object.entries(planBreakdown).map(([name, value]) => ({ name, value }))

    if (allLogs) {
      baseStats.totalSms = allLogs.length
    }
    
    return { 
        stats: baseStats, 
        growthData: growth, 
        planStats: planChartData,
        riskTenants: riskSchools.sort((a,b) => b.usage - a.usage).slice(0, 5)
    }
  }, [schools, plans, allLogs])

  const handlePostAnnouncement = () => {
    if (!firestore || !annRef) return
    const id = doc(annRef).id
    const newAnn: Announcement = {
        id,
        ...annForm,
        createdAt: new Date().toISOString()
    }
    setDocumentNonBlocking(doc(firestore, 'platform_announcements', id), newAnn, { merge: true })
    toast({ title: 'Announcement Published', description: 'All school dashboards updated.' })
    setIsAnnOpen(false)
    setAnnForm({ title: '', message: '', priority: 'medium' })
  }

  const deleteAnn = (id: string) => {
    if (!firestore) return
    deleteDocumentNonBlocking(doc(firestore, 'platform_announcements', id))
    toast({ title: 'Removed', variant: 'destructive' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">SaaS Global Command</h1>
          <p className="text-muted-foreground">Monitoring international infrastructure and revenue nodes.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => window.location.href = '/super-admin/keys'} variant="outline" className="gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold">
                <Key className="h-4 w-4" /> Activation Keys
            </Button>
            <Button onClick={() => setIsAnnOpen(true)} variant="outline" className="gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold">
                <Megaphone className="h-4 w-4" /> Broadcast Notice
            </Button>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold border border-green-200">
                <Activity className="h-3 w-3 animate-pulse" /> CLOUD ENGINE ONLINE
            </div>
        </div>
      </div>
      
      {/* KPI GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Onboarded Schools</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-headline leading-none">{stats.total}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">{stats.active} ACTIVE TENANTS</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-emerald-500 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Recurring Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-headline leading-none">₹{stats.revenue.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-emerald-600 font-black mt-2 uppercase tracking-tight">GLOBAL SUBSCRIPTION YIELD (MRR)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compliance Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-headline leading-none text-amber-600">{stats.expired}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">TENANTS REQUIRING ATTENTION</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">SMS API Inventory</CardTitle>
            <MessageSquare className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-headline leading-none">{stats.totalSms.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">GLOBAL MESSAGES DELIVERED</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* GROWTH CHART */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Registry Expansion Trend
            </CardTitle>
            <CardDescription className="text-xs">New school onboardings per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} fontSize={12} />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} />
                        <Tooltip 
                            cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={45} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PLAN BREAKDOWN */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-headline text-lg flex items-center gap-2 text-indigo-600">
                <PieIcon className="h-5 w-5" />
                Subscription Mix
            </CardTitle>
            <CardDescription className="text-xs">Popularity of SaaS Tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={planStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {planStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* CAPACITY RISKS */}
        <Card>
            <CardHeader className="pb-3 border-b">
                <CardTitle className="font-headline text-sm flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Tenant Overload Warnings
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {riskTenants.length ? riskTenants.map((risk, idx) => (
                    <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                            <span className="truncate max-w-[150px]">{risk.name}</span>
                            <span>{risk.usage}% CAPACITY</span>
                        </div>
                        <Progress value={risk.usage} className="h-1.5 [&>div]:bg-red-500" />
                        <p className="text-[9px] text-muted-foreground font-medium italic">Limit: {risk.limit} Students</p>
                    </div>
                )) : (
                    <div className="py-10 text-center flex flex-col items-center justify-center gap-2 opacity-40">
                        <ShieldCheck className="h-8 w-8 text-green-500" />
                        <p className="text-xs font-bold">ALL TENANTS WITHIN LIMITS</p>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* INFRASTRUCTURE STATUS */}
        <Card className="bg-slate-900 text-slate-50 border-slate-800 shadow-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="font-headline text-sm flex items-center gap-2 text-blue-400">
              <Server className="h-4 w-4" />
              Infrastructure Heartbeat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2 opacity-70"><Zap className="h-3 w-3 text-yellow-400" /> API Gateway</span>
                <Badge className="h-4 text-[8px] bg-green-500/20 text-green-400 border-green-500/30">99.9% UPTIME</Badge>
            </div>
            <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2 opacity-70"><Database className="h-3 w-3 text-blue-400" /> Database Shards</span>
                <Badge className="h-4 text-[8px] bg-blue-500/20 text-blue-400 border-blue-500/30">SYNCED (4/4)</Badge>
            </div>
            <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2 opacity-70"><Globe className="h-3 w-3 text-indigo-400" /> Global CDNs</span>
                <Badge className="h-4 text-[8px] bg-indigo-500/20 text-indigo-400 border-indigo-500/30">LOW LATENCY</Badge>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800 flex justify-center">
                <div className="text-[9px] font-black text-slate-500 tracking-tighter uppercase flex items-center gap-1.5">
                    <ShieldCheck className="h-3 w-3" /> Security Kernel v4.0.2 Locked
                </div>
            </div>
          </CardContent>
        </Card>

        {/* ACTIVE NOTICES */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-headline text-sm flex items-center gap-2 text-indigo-600">
                <Megaphone className="h-4 w-4" />
                Live Broadcast Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[200px] space-y-3 px-4">
            {announcements?.length ? announcements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(ann => (
                <div key={ann.id} className="p-3 bg-muted/30 rounded-lg border border-muted flex justify-between gap-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-[11px] leading-tight line-clamp-1">{ann.title}</span>
                            <Badge variant={ann.priority === 'high' ? 'destructive' : 'secondary'} className="text-[7px] uppercase h-3 px-1">{ann.priority}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 italic">"{ann.message}"</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => deleteAnn(ann.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
            )) : (
                <div className="py-8 text-center text-muted-foreground italic text-[10px]">No active broadcasts.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAnnOpen} onOpenChange={setIsAnnOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="font-headline">Broadcast System Notice</DialogTitle>
                <DialogDescription className="text-xs">This message will appear on ALL school dashboards instantly.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid gap-2">
                    <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground">Subject / Title</Label>
                    <Input value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} placeholder="e.g. Scheduled Maintenance" className="font-bold" />
                </div>
                <div className="grid gap-2">
                    <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground">Message Content</Label>
                    <Textarea value={annForm.message} onChange={e => setAnnForm({...annForm, message: e.target.value})} placeholder="Type your message here..." rows={4} className="text-sm" />
                </div>
                <div className="grid gap-2">
                    <Label className="text-xs uppercase font-black tracking-widest text-muted-foreground">Priority Level</Label>
                    <Select value={annForm.priority} onValueChange={val => setAnnForm({...annForm, priority: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low (General Info)</SelectItem>
                            <SelectItem value="medium">Medium (Important Action)</SelectItem>
                            <SelectItem value="high">High (Urgent Alert)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAnnOpen(false)}>Cancel</Button>
                <Button onClick={handlePostAnnouncement} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Megaphone className="h-4 w-4" /> Deploy Broadcast
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
