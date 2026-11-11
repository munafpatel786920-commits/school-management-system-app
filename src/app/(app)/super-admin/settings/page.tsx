'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase, useUser } from '@/firebase'
import { doc } from 'firebase/firestore'
import { toast } from '@/hooks/use-toast'
import { Loader2, Save, ShieldAlert, Globe, Activity, Lock, Zap, Database } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function PlatformSettingsPage() {
  const firestore = useFirestore()
  const { user } = useUser()
  
  const configRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'admin_setup', 'config') : null, [firestore, user])
  const { data: config, isLoading } = useDoc<any>(configRef)

  const [formData, setFormData] = useState({
    platformName: 'VidyaVerse Global',
    supportEmail: 'patelmunaf90@gmail.com',
    maintenanceMode: false,
    maxSchools: 100
  })
  
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    if (config && !hasInitialized) {
      setFormData({
        platformName: config.platformName || 'VidyaVerse Global',
        supportEmail: config.supportEmail || 'patelmunaf90@gmail.com',
        maintenanceMode: !!config.maintenanceMode,
        maxSchools: config.maxSchools || 100
      })
      setHasInitialized(true)
    }
  }, [config, hasInitialized])

  const handleSave = () => {
    if (!configRef) return
    setDocumentNonBlocking(configRef, formData, { merge: true })
    toast({ 
      title: 'Global Config Saved', 
      description: formData.maintenanceMode 
        ? 'Platform is now in GLOBAL MAINTENANCE MODE.' 
        : 'Global settings updated successfully. Platform is LIVE.' 
    })
  }

  if (isLoading && !hasInitialized) return <div className="p-12 text-center animate-pulse"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" /> Syncing Master Gateway...</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground tracking-tight">Global SaaS Configuration</h1>
          <p className="text-muted-foreground">Manage system-wide variables and platform branding.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs font-bold border border-blue-200">
            <Globe className="h-3 w-3" />
            MASTER ENGINE
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline text-lg">Branding & Global Support</CardTitle>
                <CardDescription>Configure how your platform appears to school administrators worldwide.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                <Label htmlFor="pname">Platform Display Name</Label>
                <Input 
                    id="pname" 
                    value={formData.platformName} 
                    onChange={e => setFormData({...formData, platformName: e.target.value})} 
                    placeholder="VidyaVerse Global"
                />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="semail">Primary Support Email (Global)</Label>
                <Input 
                    id="semail" 
                    type="email"
                    value={formData.supportEmail} 
                    onChange={e => setFormData({...formData, supportEmail: e.target.value})} 
                    placeholder="support@vidyaverse.com"
                />
                </div>
            </CardContent>
            </Card>

            <Card className={`transition-all border-2 ${formData.maintenanceMode ? "border-red-500 bg-red-50/20" : "border-slate-200"}`}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className={`font-headline flex items-center gap-2 ${formData.maintenanceMode ? "text-red-600" : "text-foreground"}`}>
                            <ShieldAlert className="h-5 w-5" />
                            Emergency Control Center
                        </CardTitle>
                        <CardDescription className={formData.maintenanceMode ? "text-red-700/70" : ""}>
                            Global overrides affecting every school tenant immediately.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Toggle Status</Label>
                        <Switch 
                            checked={formData.maintenanceMode} 
                            onCheckedChange={checked => setFormData({...formData, maintenanceMode: checked})}
                            className="data-[state=checked]:bg-red-600"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-colors ${formData.maintenanceMode ? "bg-red-600 text-white border-red-700 shadow-lg" : "bg-muted/50 border-dashed border-muted-foreground/20"}`}>
                <div className={`p-3 rounded-full ${formData.maintenanceMode ? "bg-white/20" : "bg-background shadow-inner"}`}>
                    {formData.maintenanceMode ? <Lock className="h-6 w-6" /> : <Activity className="h-6 w-6 text-green-600" />}
                </div>
                <div className="flex-1">
                    <p className="text-base font-black tracking-tight leading-none mb-1">
                        {formData.maintenanceMode ? "GLOBAL MAINTENANCE ACTIVE" : "PLATFORM IS ONLINE"}
                    </p>
                    <p className={`text-xs font-medium ${formData.maintenanceMode ? "text-red-100" : "text-muted-foreground"}`}>
                        {formData.maintenanceMode 
                            ? "School admins and staff are currently blocked from accessing their dashboards." 
                            : "All systems are operational and schools can log in normally."}
                    </p>
                </div>
                {formData.maintenanceMode && <Badge variant="outline" className="bg-white/10 text-white border-white/30 animate-pulse">SYSTEM LOCKED</Badge>}
                </div>

                <div className="grid gap-2">
                <Label className="font-bold flex items-center gap-2">
                    Max School Onboarding Limit
                </Label>
                <div className="flex items-center gap-4">
                    <Input 
                        type="number" 
                        className="w-32 font-mono font-bold border-2" 
                        value={formData.maxSchools} 
                        onChange={e => setFormData({...formData, maxSchools: Number(e.target.value)})} 
                    />
                    <span className="text-xs text-muted-foreground">Currently capped at {formData.maxSchools} schools.</span>
                </div>
                </div>
            </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card className="bg-slate-50 border-dashed border-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Database className="h-3.5 w-3.5" /> Database Safety
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        आपका डेटाबेस 'Persistent State' में है। नए फीचर्स जोड़ने या UI बदलने पर भी छात्रों और फीस का रिकॉर्ड सुरक्षित रहेगा।
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20 border-dashed border-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5" /> Global Sync
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        सिस्टम कॉन्फ़िगरेशन में बदलाव करने पर सभी स्कूलों के डैशबोर्ड रीयल-टाइम में अपडेट हो जाते हैं।
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-6 pt-4 border-t">
          <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-muted-foreground uppercase mb-1 tracking-widest">Planned State</span>
              <div className="flex items-center gap-2">
                  {formData.maintenanceMode ? (
                      <div className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-black shadow-lg animate-pulse border-b-4 border-red-800">
                          <Lock className="h-4 w-4" /> LOCK PLATFORM
                      </div>
                  ) : (
                      <div className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-black shadow-lg border-b-4 border-green-800">
                          <Activity className="h-4 w-4" /> KEEP LIVE
                      </div>
                  )}
              </div>
          </div>
          <Button onClick={handleSave} size="lg" className="px-12 h-16 shadow-2xl font-black text-xl bg-primary text-primary-foreground hover:scale-105 transition-all border-b-4 border-primary/50">
              <Save className="mr-2 h-6 w-6" /> Save Master Config
          </Button>
      </div>
    </div>
  )
}
