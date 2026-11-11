'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UsersRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin-panel')
  }, [router])

  return (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-muted-foreground animate-pulse">Redirecting to Admin Panel...</p>
    </div>
  )
}