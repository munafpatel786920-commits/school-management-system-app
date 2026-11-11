'use client'

import { Header } from '@/components/layout/header'
import * as React from 'react'
import { SchoolProfileProvider } from '@/context/school-profile-context'
import { DataProvider } from '@/context/data-context'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth, useUser, useFirestore } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'
import type { Role } from '@/lib/types';

import {
  BookOpenCheck,
  Briefcase,
  CalendarCheck,
  FileText,
  IndianRupee,
  LayoutDashboard,
  School,
  Users,
  ClipboardList,
  BookCopy,
  Building,
  LogOut,
  Receipt,
  Archive,
  FileCheck,
  ListOrdered,
  UsersRound,
} from 'lucide-react'

import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar'
import { useSchoolProfile } from '@/context/school-profile-context'

const allNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/users', icon: UsersRound, label: 'Admin Panel' },
  { href: '/students', icon: Users, label: 'Students' },
  { href: '/teachers', icon: Briefcase, label: 'Teachers' },
  { href: '/classes', icon: School, label: 'Classes' },
  { href: '/roster', icon: ListOrdered, label: 'Class Roster' },
  { href: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { href: '/teacher-attendance', icon: ClipboardList, label: 'Teacher Muster' },
  { href: '/fees', icon: IndianRupee, label: 'Fees' },
  { href: '/expense', icon: Receipt, label: 'Expense' },
  { href: '/dead-stock', icon: Archive, label: 'Dead Stock' },
  { href: '/exam', icon: FileCheck, label: 'Exam Marksheet' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/reports', icon: BookCopy, label: 'Reports' },
  { href: '/settings', icon: Building, label: 'School Profile' },
]

const navConfig: Record<Role, string[]> = {
    admin: allNavItems.map(item => item.label),
    principal: allNavItems.filter(item => item.label !== 'Expense' && item.label !== 'Dead Stock' && item.label !== 'Fees' && item.label !== 'Admin Panel').map(item => item.label),
    teacher: ['Dashboard', 'Class Roster', 'Attendance', 'Teacher Muster', 'Exam Marksheet'],
    accountant: ['Dashboard', 'Students', 'Fees', 'Expense', 'Dead Stock', 'Reports'],
};


function AppSidebar({ userRole }: { userRole: Role }) {
  const pathname = usePathname()
  const { schoolProfile, isLoading } = useSchoolProfile()
  const auth = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  }

  const allowedLabels = navConfig[userRole] || [];
  const navItems = allNavItems.filter(item => allowedLabels.includes(item.label));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2">
            {isLoading ? <div className="h-8 w-8 shrink-0 rounded-md bg-muted" /> : schoolProfile.logoUrl ? (
            <Image src={schoolProfile.logoUrl} alt={schoolProfile.name} width={32} height={32} className="object-contain rounded-md" />
            ) : (
            <BookOpenCheck className="h-8 w-8 shrink-0 rounded-md bg-primary p-1 text-primary-foreground" />
            )}
            <div className="flex flex-col">
                <span className="font-semibold text-base text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
                    {isLoading ? "Loading..." : schoolProfile.name}
                </span>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="justify-start"
                  tooltip={{children: item.label}}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem>
            <div className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                © patelmunaf90@gmail.com
            </div>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="justify-start" tooltip={{children: 'Logout'}}>
                <LogOut />
                <span>Logout</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </Sidebar>
  )
}

const MainAppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();

    const [userRole, setUserRole] = React.useState<Role | null>(null);
    const [isRoleLoading, setIsRoleLoading] = React.useState(true);

    React.useEffect(() => {
        if (isUserLoading) {
            return; // Wait until Firebase Auth is initialized
        }

        if (!user) {
            router.push('/login');
            return;
        }

        // If user is authenticated, fetch their role
        if (firestore && auth) {
            const userDocRef = doc(firestore, 'users', user.uid);
            getDoc(userDocRef).then((docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    const role = (userData.role as string)?.toLowerCase() as Role;
                    
                    if (['admin', 'principal', 'teacher', 'accountant'].includes(role)) {
                        setUserRole(role);
                    } else {
                        // Role is invalid or missing, sign out to break loop
                        console.error("Invalid user role, signing out:", userData.role);
                        auth.signOut();
                    }
                } else {
                    // User doc doesn't exist in Firestore, sign out
                    console.error("User document not found, signing out.");
                    auth.signOut();
                }
            }).catch(error => {
                // Error fetching document, sign out
                console.error("Error fetching user role, signing out:", error);
                auth.signOut();
            }).finally(() => {
                // Role fetching is complete (or failed), no longer loading
                setIsRoleLoading(false);
            });
        } else {
             // Fallback if services aren't ready
             setIsRoleLoading(false);
        }

    }, [isUserLoading, user, firestore, auth, router]);

    // Show a loading screen while either Firebase Auth or Firestore role fetching is in progress.
    if (isUserLoading || isRoleLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Loading VidyaVerse Dashboard...</p>
            </div>
        )
    }

    // If loading is done but we still don't have a role, it means auth failed or role was invalid.
    // The useEffect should have already triggered a sign-out and subsequent redirect.
    // This state should ideally not be visible for long.
    if (!userRole) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <p>Authorizing... Please wait.</p>
            </div>
        )
    }
    
    // If we reach here, user is authenticated and role is verified.
    return (
        <SchoolProfileProvider>
            <DataProvider>
                <SidebarProvider>
                    <AppSidebar userRole={userRole} />
                    <SidebarInset>
                    <Header />
                    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                        {children}
                    </main>
                    </SidebarInset>
                </SidebarProvider>
            </DataProvider>
      </SchoolProfileProvider>
    );
};

export default MainAppLayout;

    