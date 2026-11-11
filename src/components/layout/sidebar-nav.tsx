'use client'

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
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useSchoolProfile } from '@/context/school-profile-context'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/students', icon: Users, label: 'Students' },
  { href: '/teachers', icon: Briefcase, label: 'Teachers' },
  { href: '/classes', icon: School, label: 'Classes' },
  { href: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { href: '/teacher-attendance', icon: ClipboardList, label: 'Teacher Muster' },
  { href: '/fees', icon: IndianRupee, label: 'Fees' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/reports', icon: BookCopy, label: 'Reports' },
  { href: '/settings', icon: Building, label: 'School Profile' },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { schoolProfile } = useSchoolProfile()

  return (
    <nav className="flex flex-col items-center gap-4 px-2 sm:py-5 h-full">
      <Link
        href="/settings"
        className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base overflow-hidden"
      >
        {schoolProfile.logoUrl ? (
          <Image src={schoolProfile.logoUrl} alt={schoolProfile.name} width={36} height={36} className="object-cover" />
        ) : (
          <BookOpenCheck className="h-5 w-5 transition-all group-hover:scale-110" />
        )}
        <span className="sr-only">{schoolProfile.name}</span>
      </Link>
      <div className="flex flex-col items-center gap-y-2 w-full flex-1 overflow-y-auto">
        <TooltipProvider>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </div>
    </nav>
  )
}
