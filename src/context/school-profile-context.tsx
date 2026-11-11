'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { toast } from '@/hooks/use-toast'
import {
  useFirestore,
  useDoc,
  setDocumentNonBlocking,
  useMemoFirebase,
  useUser,
} from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { School } from '@/lib/types'
import { useData } from './data-context'

interface SchoolProfileContextType {
  schoolProfile: Partial<School>
  updateSchoolProfile: (profile: Partial<School>) => void
  isLoading: boolean
}

const SchoolProfileContext = createContext<SchoolProfileContextType | undefined>(
  undefined
)

export const SchoolProfileProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore()
  const { user } = useUser()
  const { userData, impersonatedSchoolId } = useData()
  
  // Logic: Use impersonated ID if Super Admin, otherwise use user's assigned schoolId
  const activeSchoolId = impersonatedSchoolId || userData?.schoolId

  const profileDocRef = useMemoFirebase(
    () => (firestore && user && activeSchoolId ? doc(firestore, 'schools', activeSchoolId) : null),
    [firestore, user, activeSchoolId]
  )

  const {
    data: profileData,
    isLoading: isDocLoading,
  } = useDoc<School>(profileDocRef)
  
  const [schoolProfile, setSchoolProfile] = useState<any>(null);

  useEffect(() => {
    if (!isDocLoading && profileData) {
        setSchoolProfile(profileData);
    } else if (!isDocLoading && !profileData && userData?.role === 'super_admin') {
        // Provide a virtual profile for Super Admin when in "Global Context"
        setSchoolProfile({ 
            name: impersonatedSchoolId ? 'Loading Selected School...' : 'VidyaVerse SaaS Portal', 
            id: 'saas-master',
            academicYear: 'GLOBAL'
        });
    }
  }, [profileData, isDocLoading, userData, impersonatedSchoolId]);

  const updateSchoolProfile = (profileUpdate: Partial<School>) => {
    if (!profileDocRef) return
    setDocumentNonBlocking(profileDocRef, profileUpdate, { merge: true })
    toast({ title: 'Profile Updated', description: 'School settings saved successfully.' })
  }
  
  const isLoading = isDocLoading;

  return (
    <SchoolProfileContext.Provider
      value={{ 
        schoolProfile: schoolProfile || { name: 'Synchronizing...' }, 
        updateSchoolProfile, 
        isLoading
      }}
    >
      {children}
    </SchoolProfileContext.Provider>
  )
}

export const useSchoolProfile = () => {
  const context = useContext(SchoolProfileContext)
  if (context === undefined) {
    throw new Error('useSchoolProfile must be used within a SchoolProfileProvider')
  }
  return context
}
