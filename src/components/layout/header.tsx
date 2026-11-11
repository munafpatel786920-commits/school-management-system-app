'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { usePathname } from 'next/navigation'
import { useSchoolProfile } from '@/context/school-profile-context'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function Header() {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)
  const { schoolProfile } = useSchoolProfile()

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex items-baseline gap-4">
        <div className="hidden md:flex items-baseline gap-2">
            <h1 className="text-xl font-semibold font-headline">{schoolProfile?.name || 'VidyaVerse'}</h1>
            {schoolProfile?.academicYear && (
                <span className="text-sm text-muted-foreground">({schoolProfile.academicYear})</span>
            )}
        </div>
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.map((segment, index) => {
              const href = '/' + pathSegments.slice(0, index + 1).join('/')
              const isLast = index === pathSegments.length - 1
              return (
                <React.Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="capitalize font-headline">
                        {segment.replace(/-/g, ' ')}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href} className="capitalize">
                          {segment.replace(/-/g, ' ')}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="relative ml-auto flex-1 md:grow-0">
      </div>
    </header>
  )
}
