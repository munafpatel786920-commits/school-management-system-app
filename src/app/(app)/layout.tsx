
'use client'

import { Header } from '@/components/layout/header'
import * as React from 'react'
import { SchoolProfileProvider } from '@/context/school-profile-context'
import { DataProvider } from '@/context/data-context'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore'
import type { Role, Announcement, School } from '@/lib/types';
import { toast } from '@/hooks/use-toast'
import { AlertTriangle, LogOut, LayoutDashboard, UsersRound, Users, Briefcase, School as SchoolIcon, ListOrdered, CalendarCheck, ClipboardList, IndianRupee, Receipt, Archive, FileCheck, FileText, BookCopy, Building, ShieldCheck, Globe, CreditCard, MessageSquare, Settings2, Hammer, CalendarDays, Zap, Megaphone, UserCircle, Database, HelpCircle } from 'lucide-react'

import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar'
import { useSchoolProfile } from '@/context/school-profile-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useData } from '@/context/data-context'

const APP_VERSION = "v4.0.5-stable";
const SUPPORT_EMAIL = "patelmunaf90@gmail.com";

const SCHOOL_ROLES = ['super_admin', 'school_admin', 'teacher', 'accountant'];

const allNavItems = [
  { href: '/super-admin', icon: ShieldCheck, label: 'SaaS Center', roles: ['super_admin'] },
  { href: '/super-admin/schools', icon: Globe, label: 'Manage Schools', roles: ['super_admin'] },
  { href: '/super-admin/plans', icon: CreditCard, label: 'Plans & Billing', roles: ['super_admin'] },
  { href: '/super-admin/sms', icon: MessageSquare, label: 'SMS Control', roles: ['super_admin'] },
  { href: '/super-admin/settings', icon: Settings2, label: 'Platform Config', roles: ['super_admin'] },
  
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: SCHOOL_ROLES },
  { href: '/admin-panel', icon: UsersRound, label: 'Staff Registry', roles: ['super_admin', 'school_admin'] },
  { href: '/student-database', icon: Database, label: 'Student Database', roles: ['super_admin', 'school_admin', 'accountant'] },
  { href: '/students', icon: Users, label: 'New Admission', roles: ['super_admin', 'school_admin', 'accountant'] },
  { href: '/teachers', icon: Briefcase, label: 'Teachers', roles: ['super_admin', 'school_admin'] },
  { href: '/classes', icon: SchoolIcon, label: 'Classes', roles: ['super_admin', 'school_admin'] },
  { href: '/roster', icon: ListOrdered, label: 'Class Roster', roles: ['super_admin', 'school_admin', 'teacher'] },
  { href: '/attendance', icon: CalendarCheck, label: 'Attendance', roles: ['super_admin', 'school_admin', 'teacher'] },
  { href: '/teacher-attendance', icon: ClipboardList, label: 'Staff Muster', roles: ['super_admin', 'school_admin', 'teacher'] },
  { href: '/fees', icon: IndianRupee, label: 'Fees', roles: ['super_admin', 'school_admin', 'accountant'] },
  { href: '/expense', icon: Receipt, label: 'Expense', roles: ['super_admin', 'school_admin', 'accountant'] },
  { href: '/communication', icon: MessageSquare, label: 'Communication', roles: ['super_admin', 'school_admin'] },
  { href: '/dead-stock', icon: Archive, label: 'Dead Stock', roles: ['super_admin', 'school_admin', 'accountant'] },
  { href: '/exam', icon: FileCheck, label: 'Marksheets', roles: ['super_admin', 'school_admin', 'teacher'] },
  { href: '/exam-schedule', icon: CalendarDays, label: 'Time Table', roles: ['super_admin', 'school_admin', 'teacher'] },
  { href: '/documents', icon: FileText, label: 'Documents', roles: ['super_admin', 'school_admin'] },
  { href: '/reports', icon: BookCopy, label: 'Reports', roles: ['super_admin', 'school_admin', 'accountant'] },
  { href: '/settings', icon: Building, label: 'School Settings', roles: ['super_admin', 'school_admin'] },
]

function AppSidebar({ userRole }: { userRole: Role }) {
  const pathname = usePathname()
  const { schoolProfile, isLoading: profileLoading } = useSchoolProfile()
  const auth = useAuth()
  const firestore = useFirestore()
  const router = useRouter()
  const { user } = useUser()
  const { impersonatedSchoolId, setImpersonatedSchoolId } = useData()

  const schoolsRef = useMemoFirebase(() => (firestore && user && userRole === 'super_admin') ? collection(firestore, 'schools') : null, [firestore, user, userRole])
  const { data: allSchools } = useCollection<School>(schoolsRef)

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  }

  const handleSchoolChange = (val: string) => {
    const newId = val === 'global' ? null : val;
    setImpersonatedSchoolId(newId);
    if (newId) {
        toast({ title: 'Context Switched', description: `Now viewing ${allSchools?.find(s => s.id === newId)?.name}` });
        router.push('/dashboard');
    } else {
        toast({ title: 'SaaS Mode Active', description: 'Returning to Global Command Center.' });
        router.push('/super-admin');
    }
  }

  const navItems = React.useMemo(() => {
    if (!userRole) return [];
    if (userRole === 'super_admin') {
        if (impersonatedSchoolId) {
            return allNavItems.filter(item => item.roles.includes('super_admin') || item.roles.includes('school_admin'));
        }
        return allNavItems.filter(item => item.roles.includes('super_admin') && !SCHOOL_ROLES.filter(r => r !== 'super_admin').some(r => item.roles.includes(r)));
    }
    return allNavItems.filter(item => item.roles.includes(userRole));
  }, [userRole, impersonatedSchoolId]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            {userRole === 'super_admin' && !impersonatedSchoolId ? (
                <div className="h-8 w-8 shrink-0 rounded-md bg-slate-900 flex items-center justify-center border border-white/10 shadow-lg">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
            ) : (
                profileLoading ? <div className="h-8 w-8 shrink-0 rounded-md bg-muted animate-pulse" /> : schoolProfile?.logoUrl ? (
                <Image src={schoolProfile.logoUrl} alt={schoolProfile.name || ''} width={32} height={32} className="object-contain rounded-md shadow-sm bg-white" />
                ) : (
                <SchoolIcon className="h-8 w-8 shrink-0 rounded-md bg-primary p-1.5 text-primary-foreground" />
                )
            )}
            <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
                    {userRole === 'super_admin' && !impersonatedSchoolId ? "SaaS Master" : (profileLoading ? "Loading..." : (schoolProfile?.name || 'School Portal'))}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest group-data-[collapsible=icon]:hidden">
                    {impersonatedSchoolId ? "Tenant View" : userRole.replace('_', ' ')}
                </span>
            </div>
        </div>
        
        {userRole === 'super_admin' && (
            <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
                <Select value={impersonatedSchoolId || 'global'} onValueChange={handleSchoolChange}>
                    <SelectTrigger className="h-8 text-[10px] font-black uppercase tracking-widest bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                        <UserCircle className="h-3 w-3 mr-1" />
                        <SelectValue placeholder="Context: Global" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="global">Context: SaaS Center</SelectItem>
                        {allSchools?.map(s => (
                            <SelectItem key={s.id} value={s.id}>Impersonate: {s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="justify-start transition-all"
                  tooltip={{children: item.label}}
                >
                  <Link href={item.href}>
                    <item.icon className={isActive ? "text-primary" : "text-muted-foreground"} />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-2 bg-muted/10">
        <div className="px-2 py-3 mb-2 rounded-lg bg-blue-50/50 border border-blue-100 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2 mb-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[10px] font-black uppercase text-blue-800 tracking-tight">Need Support?</span>
            </div>
            <button 
                onClick={() => { window.location.href = `mailto:${SUPPORT_EMAIL}`; }}
                className="text-[9px] font-bold text-blue-600 hover:underline break-all block text-left"
            >
                {SUPPORT_EMAIL}
            </button>
            <div className="mt-2 pt-2 border-t border-blue-100 flex justify-between items-center">
                <span className="text-[8px] font-black text-muted-foreground uppercase">{APP_VERSION}</span>
                <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-green-600 uppercase">Live</span>
                </div>
            </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="justify-start text-destructive hover:bg-destructive/5 hover:text-destructive" tooltip={{children: 'Logout'}}>
                <LogOut />
                <span>Logout Session</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

const MainAppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [userRole, setUserRole] = React.useState<Role | null>(null);
    const [isRoleLoading, setIsRoleLoading] = React.useState(true);
    const [isMaintenanceMode, setIsMaintenanceMode] = React.useState(false);

    const annQuery = useMemoFirebase(() => 
        (firestore && user) ? query(collection(firestore, 'platform_announcements'), orderBy('createdAt', 'desc'), limit(1)) : null, 
    [firestore, user]);
    const { data: latestAnnouncements } = useCollection<Announcement>(annQuery);
    const latestAnn = latestAnnouncements?.[0];

    React.useEffect(() => {
        if (isUserLoading || !firestore || !auth || !user) {
            if (!isUserLoading && !user) router.push('/login');
            return;
        }

        const configRef = doc(firestore, 'admin_setup', 'config');
        const unsubConfig = onSnapshot(configRef, (snap) => {
            setIsMaintenanceMode(snap.exists() ? !!snap.data().maintenanceMode : false);
        }, (err) => {
            console.warn("Could not read global config:", err);
        });

        const userDocRef = doc(firestore, 'users', user.uid);
        const unsubUser = onSnapshot(userDocRef, (userSnap) => {
            if (!userSnap.exists()) {
                auth.signOut();
                router.push('/login');
                return;
            }

            const userData = userSnap.data();
            let role = (userData.role as string)?.toLowerCase() as Role;
            if (role === 'admin' as any) role = 'super_admin';
            setUserRole(role);
            setIsRoleLoading(false);

            if (role === 'super_admin' && (pathname === '/' || pathname === '/login')) {
                router.replace('/super-admin');
            }

            if (role !== 'super_admin' && userData.schoolId) {
                const schoolRef = doc(firestore, 'schools', userData.schoolId);
                const unsubSchool = onSnapshot(schoolRef, (schoolSnap) => {
                    if (schoolSnap.exists() && schoolSnap.data()?.status !== 'active') {
                        toast({ variant: 'destructive', title: 'Access Revoked', description: 'This school account has been suspended.' });
                        auth.signOut();
                        router.push('/login');
                    }
                }, (err) => {
                    console.warn("School listener error:", err);
                });
                return () => unsubSchool();
            }
        }, (err) => {
            console.warn("User listener error:", err);
            setIsRoleLoading(false);
        });

        return () => {
            unsubConfig();
            unsubUser();
        }
    }, [isUserLoading, user, firestore, auth, router, pathname]);

    if (isUserLoading || isRoleLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-4 bg-background">
                <div className="p-4 bg-primary/10 rounded-full animate-pulse">
                    <ShieldCheck className="h-12 w-12 text-primary" />
                </div>
                <p className="text-sm font-medium font-headline animate-pulse tracking-widest uppercase">Securing Global Connection...</p>
            </div>
        )
    }

    if (isMaintenanceMode && userRole !== 'super_admin') {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full border-t-4 border-t-amber-500 shadow-2xl bg-white rounded-xl p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="p-4 bg-amber-100 rounded-full">
                            <Hammer className="h-12 w-12 text-amber-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold font-headline">System Upgrade in Progress</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        We are performing a scheduled infrastructure update to improve your experience. 
                        We will be back online shortly. Thank you for your patience.
                    </p>
                    <div className="pt-4 space-y-3">
                        <div className="p-3 bg-muted rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Maintenance Kernel v4.0 Active
                        </div>
                        <button onClick={() => auth?.signOut().then(() => router.push('/login'))} className="text-xs font-bold text-blue-600 hover:underline">Back to Login Gateway</button>
                    </div>
                </div>
            </div>
        )
    }

    if (!userRole) return null;

    const marqueeContent = (
        <div className="flex items-center">
            <span className="mx-8 text-[11px] font-bold uppercase tracking-tighter text-blue-400">VIDYA VERSE GLOBAL SCHOOL MANAGEMENT SYSTEM</span>
            <span className="mx-8 text-[11px] font-medium text-slate-400">• DATABASE KERNEL v4.0 ACTIVE •</span>
            <span className="mx-8 text-[11px] font-bold uppercase tracking-tighter text-blue-400">MULTI-TENANT ISOLATION ENABLED</span>
            <span className="mx-8 text-[11px] font-medium text-slate-400">• GLOBAL INFRASTRUCTURE ONLINE •</span>
        </div>
    );
    
    return (
        <DataProvider>
            <SchoolProfileProvider>
                <SidebarProvider>
                    <AppSidebar userRole={userRole} />
                    <SidebarInset className="overflow-hidden">
                    <div className="w-full flex flex-col shadow-sm flex-shrink-0">
                        <div className="w-full bg-slate-900 text-white h-8 overflow-hidden flex items-center relative border-b border-white/10">
                            <div className="absolute left-0 z-30 h-full px-3 bg-primary text-primary-foreground flex items-center gap-1.5 font-black text-[10px] tracking-widest italic shadow-[4px_0_10px_rgba(0,0,0,0.3)]">
                                <Zap className="h-3.5 w-3.5 fill-current" /> LIVE
                            </div>
                            <div className="flex-1 whitespace-nowrap overflow-hidden flex">
                                <div className="animate-marquee">
                                    {marqueeContent}
                                    {marqueeContent}
                                </div>
                            </div>
                        </div>
                        
                        {userRole !== 'super_admin' && latestAnn && (
                            <div className={`px-4 py-2 flex items-center justify-between gap-4 border-b transition-colors ${latestAnn.priority === 'high' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                                <div className="flex items-center gap-2">
                                    <Megaphone className={`h-4 w-4 ${latestAnn.priority === 'high' ? 'text-red-600 animate-bounce' : 'text-blue-600'}`} />
                                    <p className="text-[11px] font-bold">
                                        <span className="uppercase tracking-wide mr-2 opacity-70">Platform Notice:</span>
                                        {latestAnn.message}
                                    </p>
                                </div>
                                <span className="text-[9px] font-black uppercase text-muted-foreground whitespace-nowrap">{latestAnn.title}</span>
                            </div>
                        )}

                        {isMaintenanceMode && userRole === 'super_admin' && (
                            <div className="bg-yellow-400 text-yellow-950 px-4 py-3 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-md border-b-2 border-yellow-500">
                                <AlertTriangle className="h-4 w-4 animate-bounce" />
                                <span>Platform Locked: Maintenance Mode Active</span>
                                <AlertTriangle className="h-4 w-4 animate-bounce" />
                            </div>
                        )}
                        <Header />
                    </div>
                    <main className="flex-1 overflow-hidden p-3 md:p-4">
                        {children}
                    </main>
                    </SidebarInset>
                </SidebarProvider>
            </SchoolProfileProvider>
        </DataProvider>
    );
};

export default MainAppLayout;
