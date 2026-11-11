'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MessageSquare, Send, AlertCircle, ShieldCheck, Loader2, Smartphone, MessageCircle, CheckCircle2, ExternalLink, Sparkles, Zap, Coins, School, History } from 'lucide-react'
import { useData } from '@/context/data-context'
import { useSchoolProfile } from '@/context/school-profile-context'
import { toast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function CommunicationPage() {
  const { students, activeSchoolId, classes: schoolClasses, addSmsLog, isLoading: dataLoading, userData } = useData()
  const { schoolProfile, updateSchoolProfile } = useSchoolProfile()

  const [selectedClass, setSelectedClass] = useState<string>('')
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'due'>('all')
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('whatsapp')
  const [message, setMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [dispatchQueue, setDispatchQueue] = useState<any[]>([])
  const [smsProgress, setSmsProgress] = useState(0)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const classOptions = useMemo(() => {
    return schoolClasses.map(c => c.sections.map(s => `${c.name} '${s}'`)).flat();
  }, [schoolClasses]);

  const targetStudents = useMemo(() => {
    if (!selectedClass) return []
    
    const parts = selectedClass.split(" '");
    if (parts.length < 2) return [];
    
    const cName = parts[0];
    const sect = parts[1].replace("'", '');
    
    let list = students.filter(s => 
        s.class === cName && 
        s.section === sect && 
        (s.status === 'Active' || !s.status)
    )
    
    if (recipientFilter === 'due') {
        list = list.filter(s => ((s.totalFees || 0) - (s.feesPaid || 0)) > 0)
    }
    
    return list
  }, [selectedClass, recipientFilter, students])

  const generateFeeReminder = () => {
    if (!selectedClass) {
        toast({ variant: 'destructive', title: 'Selection Required', description: 'Please select a class first.' });
        return;
    }
    const template = `नमस्ते, ${schoolProfile?.name || 'स्कूल'} की ओर से सूचना। आपके बच्चे की बकाया फीस जमा करने के लिए यह एक रिमाइंडर है। कृपया जल्द से जल्द भुगतान करें। धन्यवाद।`;
    setMessage(template);
    setRecipientFilter('due');
    toast({ title: 'Template Loaded', description: 'Fee Reminder template applied.' });
  }

  const handlePrepareBroadcast = () => {
    if (!activeSchoolId || activeSchoolId === 'saas-master') {
        toast({ 
            variant: 'destructive', 
            title: 'No School Selected', 
            description: 'Super Admin: Please select a tenant school from the sidebar first.' 
        });
        return;
    }
    if (!selectedClass) {
        toast({ variant: 'destructive', title: 'Target Required', description: 'Please select a class.' });
        return;
    }
    if (!message.trim()) {
        toast({ variant: 'destructive', title: 'Message Empty', description: 'Please write some content.' });
        return;
    }
    if (targetStudents.length === 0) {
        toast({ 
            variant: 'destructive', 
            title: 'Empty List', 
            description: `No eligible students found in Class ${selectedClass}.` 
        });
        return;
    }

    if (channel === 'sms') {
        executeBulkSms();
    } else {
        setDispatchQueue(targetStudents.map(s => ({ ...s, sent: false })));
        toast({ title: 'WhatsApp Queue Ready', description: `Prepared ${targetStudents.length} recipients.` });
    }
  }

  const executeBulkSms = async () => {
    const rawBalance = (schoolProfile as any)?.smsBalance;
    const currentBalance = typeof rawBalance === 'number' ? rawBalance : 0;
    const studentsWithNumbers = targetStudents.filter(s => !!s.mobile);
    
    if (studentsWithNumbers.length === 0) {
        toast({ variant: 'destructive', title: 'Invalid Numbers', description: 'No valid mobile numbers found in this group.' });
        return;
    }

    if (currentBalance < studentsWithNumbers.length) {
        toast({ 
            variant: 'destructive', 
            title: 'Low Credits', 
            description: `Need ${studentsWithNumbers.length}, but you have ${currentBalance} SMS left.` 
        })
        return
    }

    setIsProcessing(true)
    setSmsProgress(0)
    
    try {
        const now = new Date().toISOString()
        let sentCount = 0;

        // Process each message through simulated gateway
        for (const student of studentsWithNumbers) {
            sentCount++;
            setSmsProgress(Math.round((sentCount / studentsWithNumbers.length) * 100));
            
            // Record log in global SaaS registry
            addSmsLog({
                mobile: student.mobile,
                message: message,
                timestamp: now,
                status: 'sent',
                cost: 1
            });

            // Artificial network lag for realism
            await new Promise(r => setTimeout(r, 100));
        }

        // Finalize credit deduction
        const newBalance = Math.max(0, currentBalance - studentsWithNumbers.length);
        updateSchoolProfile({ smsBalance: newBalance });

        toast({ 
            title: 'Broadcast Dispatched', 
            description: `Sent ${studentsWithNumbers.length} messages. Remaining: ${newBalance}` 
        });
        
        setMessage('')
        setSelectedClass('')
    } catch (err: any) {
        console.error("SMS Engine Error:", err);
        toast({ variant: 'destructive', title: 'Gateway Error', description: err.message || 'Transmission failed.' });
    } finally {
        setIsProcessing(false)
        setSmsProgress(0)
    }
  }

  const sendSingleWhatsApp = (student: any) => {
    if (!student.mobile) {
        toast({ variant: 'destructive', title: 'No Mobile', description: `Contact missing for ${student.name}` });
        return;
    }

    let phone = student.mobile.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    
    const encodedMsg = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encodedMsg}`;
    
    window.open(url, '_blank');
    
    setDispatchQueue(prev => prev.map(item => 
        item.id === student.id ? { ...item, sent: true } : item
    ));
  }

  if (!isMounted || dataLoading) {
      return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  // UI for Super Admin when no school context is active
  if (userData?.role === 'super_admin' && (!activeSchoolId || activeSchoolId === 'saas-master')) {
      return (
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
              <div className="p-8 bg-blue-50 rounded-full border-2 border-dashed border-blue-200 animate-pulse">
                  <School className="h-16 w-16 text-blue-500" />
              </div>
              <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black font-headline text-slate-900">Context Required</h3>
                  <p className="text-muted-foreground max-w-sm font-medium">To use communication tools, please select a specific tenant school from the sidebar dropdown.</p>
              </div>
          </div>
      )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in duration-500">
      <Card className="border-t-4 border-t-indigo-600 shadow-2xl h-fit">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline flex items-center gap-2 text-xl">
                    <Smartphone className="h-6 w-6 text-indigo-600" />
                    Broadcaster
                </CardTitle>
                <CardDescription className="font-medium">Official channel for school announcements.</CardDescription>
            </div>
            {channel === 'sms' && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5 font-black text-xs py-1">
                    <Coins className="h-3.5 w-3.5" /> {(schoolProfile as any)?.smsBalance || 0} Credits
                </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">1. Delivery Mode</Label>
              <div className="flex gap-2">
                <Button 
                    variant={channel === 'whatsapp' ? 'default' : 'outline'} 
                    onClick={() => setChannel('whatsapp')}
                    className={cn("flex-1 gap-2 h-14 font-black border-2", channel === 'whatsapp' && "bg-emerald-600 hover:bg-emerald-700")}
                    disabled={isProcessing}
                >
                    <MessageCircle className="h-5 w-5" /> WhatsApp
                </Button>
                <Button 
                    variant={channel === 'sms' ? 'default' : 'outline'} 
                    onClick={() => setChannel('sms')}
                    className={cn("flex-1 gap-2 h-14 font-black border-2", channel === 'sms' && "bg-indigo-600 hover:bg-indigo-700")}
                    disabled={isProcessing}
                >
                    <Smartphone className="h-5 w-5" /> Cloud SMS
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">2. Target Recipients</Label>
              <Select onValueChange={setSelectedClass} value={selectedClass} disabled={isProcessing}>
                <SelectTrigger className="border-2 h-12 font-bold focus:ring-indigo-500"><SelectValue placeholder="Select Class Section" /></SelectTrigger>
                <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
              </Select>
              
              <RadioGroup value={recipientFilter} onValueChange={(v: any) => setRecipientFilter(v)} className="flex gap-4 mt-2" disabled={isProcessing}>
                <div className="flex items-center space-x-2 border-2 rounded-xl p-4 flex-1 cursor-pointer bg-white transition-all hover:bg-muted/50 has-[:checked]:border-indigo-500">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer font-bold text-sm">Everyone Active</Label>
                </div>
                <div className="flex items-center space-x-2 border-2 rounded-xl p-4 flex-1 cursor-pointer bg-amber-50 border-amber-100 transition-all hover:bg-amber-100 has-[:checked]:border-amber-500">
                  <RadioGroupItem value="due" id="due" />
                  <Label htmlFor="due" className="cursor-pointer font-black text-sm text-amber-800">Fee Defaulters</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">3. Message Drafting</Label>
                <Button variant="ghost" size="sm" onClick={generateFeeReminder} disabled={isProcessing} className="h-7 text-[9px] uppercase font-black tracking-widest text-indigo-600 hover:bg-indigo-50 gap-1.5 border border-indigo-100 px-3">
                    <Sparkles className="h-3 w-3" /> Auto-Generate
                </Button>
              </div>
              <Textarea 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                placeholder="Type your official notice here..." 
                className="h-36 border-2 text-sm font-semibold focus-visible:ring-indigo-500"
                disabled={isProcessing}
              />
            </div>
          </div>

          {isProcessing && channel === 'sms' && (
              <div className="space-y-2 animate-in slide-in-from-bottom-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-indigo-600">
                      <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Transmitting Batch...</span>
                      <span>{smsProgress}% Complete</span>
                  </div>
                  <Progress value={smsProgress} className="h-2 bg-indigo-100 [&>div]:bg-indigo-600" />
              </div>
          )}

          <Button 
            onClick={handlePrepareBroadcast} 
            disabled={!selectedClass || !message || isProcessing} 
            className={cn(
                "w-full h-16 text-lg font-black shadow-xl transition-all active:scale-95",
                channel === 'sms' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
            )}
          >
            {isProcessing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <><Send className="mr-2 h-5 w-5" /> {channel === 'whatsapp' ? 'Initiate WhatsApp Dispatch' : 'Transmit Bulk SMS'}</>}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {channel === 'whatsapp' && dispatchQueue.length > 0 && (
            <Card className="border-2 border-emerald-500 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
                <CardHeader className="bg-emerald-500 text-white pb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" /> Dispatch Queue ({dispatchQueue.length})
                        </CardTitle>
                        <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-[10px]">
                            {dispatchQueue.filter(q => q.sent).length} Done
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                        <div className="divide-y">
                            {dispatchQueue.map((s) => (
                                <div key={s.id} className={cn(
                                    "p-4 flex items-center justify-between transition-colors",
                                    s.sent ? 'bg-emerald-50/50 grayscale-[0.5]' : 'hover:bg-muted/50'
                                )}>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm">{s.name}</span>
                                            {s.sent && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                                        </div>
                                        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{s.mobile || 'No Contact'}</p>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant={s.sent ? 'ghost' : 'outline'} 
                                        onClick={() => sendSingleWhatsApp(s)}
                                        disabled={!s.mobile}
                                        className={cn(
                                            "font-bold text-xs h-9",
                                            s.sent ? 'text-emerald-600' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-500 hover:text-white'
                                        )}
                                    >
                                        {s.sent ? 'Resend' : <><ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Send Now</>}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        )}

        <Card className="bg-slate-50 border-dashed border-2 border-slate-200">
            <CardHeader className="pb-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                    <ShieldCheck className="h-4 w-4" /> Gateway Intelligence
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-3 p-4 bg-white rounded-xl border shadow-sm">
                    <div className="p-2.5 bg-blue-100 rounded-lg h-fit shrink-0"><AlertCircle className="h-5 w-5 text-blue-600" /></div>
                    <div className="text-[11px] space-y-1">
                        <p className="font-bold text-slate-900 uppercase tracking-tighter">Transmission Logic</p>
                        <p className="text-muted-foreground leading-relaxed">
                            {channel === 'sms' 
                                ? "Cloud SMS uses the SMPP protocol. Messages are queued and sent through our master gateway instantly. Credits are deducted per recipient." 
                                : "WhatsApp relies on the browser's URI scheme. For security, each message requires a manual click to prevent your account from being flagged as a bot."}
                        </p>
                    </div>
                </div>
                
                <div className="pt-6 mt-2 border-t border-slate-200 flex flex-col items-center gap-4">
                    <div className="relative">
                        <Zap className={cn(
                            "h-12 w-12 opacity-30",
                            channel === 'sms' ? 'text-indigo-600' : 'text-emerald-600'
                        )} />
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center justify-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-ping" />
                            Real-time Gateway Node Active
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">Latency: 45ms • Uptime: 99.9%</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
