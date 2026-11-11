'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { SchoolProfileForm } from './school-profile-form'
import { MasterReset } from './master-reset'
import { BackupRestore } from './backup-restore'
import { SessionManagement } from './session-management'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building, GraduationCap, ShieldAlert, FileJson } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Institutional Controls</h1>
        <p className="text-muted-foreground">Manage your school identity, academic cycles, and data security.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50 border p-1 h-12 flex-wrap">
          <TabsTrigger value="profile" className="gap-2 h-10 px-6 data-[state=active]:shadow-md">
            <Building className="h-4 w-4" />
            School Profile
          </TabsTrigger>
          <TabsTrigger value="session" className="gap-2 h-10 px-6 data-[state=active]:shadow-md">
            <GraduationCap className="h-4 w-4" />
            Session Rollover
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-2 h-10 px-6 data-[state=active]:text-destructive data-[state=active]:shadow-md">
            <ShieldAlert className="h-4 w-4" />
            Security & Reset
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Identity & Branding</CardTitle>
              <CardDescription>
                Customize how your school appears on official documents and dashboards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SchoolProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session">
          <SessionManagement />
        </TabsContent>

        <TabsContent value="danger" className="space-y-6">
          <BackupRestore />
          <MasterReset />
        </TabsContent>
      </Tabs>
    </div>
  )
}
