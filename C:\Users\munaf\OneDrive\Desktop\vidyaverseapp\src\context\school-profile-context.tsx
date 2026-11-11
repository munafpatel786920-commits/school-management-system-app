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
} from '@/firebase'
import { doc } from 'firebase/firestore'
import type { SchoolProfile } from '@/lib/types'

const defaultSchoolProfile: SchoolProfile = {
  id: 'main',
  name: 'New VidyaVerse School',
  affiliationNo: 'N/A',
  schoolCode: 'N/A',
  udiseCode: 'N/A',
  address: 'School Address Here',
  logoUrl: '',
  principalName: 'Principal Name Here',
  academicYear: '2024-2025',
}

interface SchoolProfileContextType {
  schoolProfile: SchoolProfile
  updateSchoolProfile: (profile: Partial<SchoolProfile>) => void
  isLoading: boolean
}

const SchoolProfileContext = createContext<SchoolProfileContextType | undefined>(
  undefined
)

export const SchoolProfileProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore()
  
  const profileDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'school_profile', 'main') : null),
    [firestore]
  )

  const {
    data: profileData,
    isLoading: isDocLoading,
    error,
  } = useDoc<SchoolProfile>(profileDocRef)
  
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(defaultSchoolProfile);

  useEffect(() => {
    if (!isDocLoading && profileData) {
        const completeProfile = { ...defaultSchoolProfile, ...profileData };
        setSchoolProfile(completeProfile);
    }
  }, [profileData, isDocLoading]);

  useEffect(() => {
    if(error){
      console.error("Error fetching school profile:", error);
    }
  }, [error]);

  const updateSchoolProfile = (profileUpdate: Partial<SchoolProfile>) => {
    if (!profileDocRef) {
       toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Could not connect to the database to save the profile.',
      });
      return;
    }
    
    setDocumentNonBlocking(profileDocRef, profileUpdate, { merge: true })
    
    toast({
      title: 'Profile Saved',
      description: 'Your school profile has been updated successfully.',
    })
  }

  return (
    <SchoolProfileContext.Provider
      value={{ schoolProfile, updateSchoolProfile, isLoading: isDocLoading }}
    >
      {children}
    </SchoolProfileContext.Provider>
  )
}

export const useSchoolProfile = () => {
  const context = useContext(SchoolProfileContext)
  if (context === undefined) {
    throw new Error(
      'useSchoolProfile must be used within a SchoolProfileProvider'
    )
  }
  return context
}
