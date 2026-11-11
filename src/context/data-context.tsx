'use client'

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react'
import type { Student, Teacher, SchoolClass, Expense, DeadStock, FeePayment, User, Attendance, TeacherAttendance, ExamSchedule } from '@/lib/types'
import {
  useFirestore,
  useCollection,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useMemoFirebase,
  useUser,
} from '@/firebase'
import { collection, doc, query, where, getDoc, increment, updateDoc, setDoc } from 'firebase/firestore'

interface DataContextType {
  students: Student[]
  teachers: Teacher[]
  classes: SchoolClass[]
  expenses: Expense[]
  deadStock: DeadStock[]
  feePayments: FeePayment[]
  examSchedules: ExamSchedule[]
  isLoading: boolean
  userData: User | null
  impersonatedSchoolId: string | null
  activeSchoolId: string | null
  setImpersonatedSchoolId: (id: string | null) => void
  addStudent: (student: Omit<Student, 'id' | 'schoolId'>) => void
  updateStudent: (student: Student) => void
  deleteStudent: (studentId: string) => void
  addTeacher: (teacher: Omit<Teacher, 'id' | 'schoolId'>) => void
  updateTeacher: (teacher: Teacher) => void
  deleteTeacher: (teacherId: string) => void
  addClass: (schoolClass: Omit<SchoolClass, 'id' | 'schoolId'>) => void
  updateClass: (schoolClass: SchoolClass) => void
  deleteClass: (classId: string) => void
  addExpense: (expense: Omit<Expense, 'id' | 'schoolId'>) => void
  updateExpense: (expense: Expense) => void
  deleteExpense: (expenseId: string) => void
  addDeadStock: (item: Omit<DeadStock, 'id' | 'schoolId'>) => void
  updateDeadStock: (item: DeadStock) => void
  deleteDeadStock: (itemId: string) => void
  addFeePayment: (payment: Omit<FeePayment, 'id' | 'schoolId'>) => void
  addAttendance: (attendance: Omit<Attendance, 'id' | 'schoolId'>) => void
  addTeacherAttendance: (attendance: Omit<TeacherAttendance, 'id' | 'schoolId'>) => void
  addSmsLog: (log: any) => void
  saveExamSchedule: (schedule: Omit<ExamSchedule, 'schoolId' | 'createdAt'>) => void
  deleteExamSchedule: (id: string) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore()
  const { user } = useUser()
  const [userData, setUserData] = useState<User | null>(null)
  const [isUserRecordLoading, setIsUserRecordLoading] = useState(true)
  const [impersonatedSchoolId, setImpersonatedSchoolId] = useState<string | null>(null)

  useEffect(() => {
    if (firestore && user) {
      const userRef = doc(firestore, 'users', user.uid)
      getDoc(userRef).then(snap => {
        if (snap.exists()) {
          const data = snap.data() as User;
          if (data.role === 'admin' as any) data.role = 'super_admin';
          setUserData(data)
        }
        setIsUserRecordLoading(false)
      }).catch(() => setIsUserRecordLoading(false))
    } else if (!user) {
      setUserData(null)
      setIsUserRecordLoading(false)
    }
  }, [firestore, user])

  const isSuperAdmin = userData?.role === 'super_admin'
  const activeSchoolId = impersonatedSchoolId || userData?.schoolId || null

  const createTenantQuery = (collectionName: string) => {
    if (!firestore || !user || isUserRecordLoading) return null
    const colRef = collection(firestore, collectionName)
    
    if (isSuperAdmin && !impersonatedSchoolId) {
        return null;
    }
    
    if (!activeSchoolId) return null
    return query(colRef, where('schoolId', '==', activeSchoolId))
  }

  const studentsQuery = useMemoFirebase(() => createTenantQuery('students'), [firestore, user, userData, isUserRecordLoading, impersonatedSchoolId])
  const teachersQuery = useMemoFirebase(() => createTenantQuery('teachers'), [firestore, user, userData, isUserRecordLoading, impersonatedSchoolId])
  const classesQuery = useMemoFirebase(() => createTenantQuery('classes'), [firestore, user, userData, isUserRecordLoading, impersonatedSchoolId])
  const expensesQuery = useMemoFirebase(() => createTenantQuery('expenses'), [firestore, user, userData, isUserRecordLoading, impersonatedSchoolId])
  const deadStockQuery = useMemoFirebase(() => createTenantQuery('dead_stock'), [firestore, user, userData, isUserRecordLoading, impersonatedSchoolId])
  const feePaymentsQuery = useMemoFirebase(() => createTenantQuery('fees'), [firestore, user, userData, isUserRecordLoading, impersonatedSchoolId])
  const schedulesQuery = useMemoFirebase(() => createTenantQuery('exam_schedules'), [firestore, user, userData, isUserRecordLoading, impersonatedSchoolId])
  
  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery)
  const { data: teachers, isLoading: teachersLoading } = useCollection<Teacher>(teachersQuery)
  const { data: classes, isLoading: classesLoading } = useCollection<SchoolClass>(classesQuery)
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery)
  const { data: deadStock, isLoading: deadStockLoading } = useCollection<DeadStock>(deadStockQuery)
  const { data: feePayments, isLoading: feePaymentsLoading } = useCollection<FeePayment>(feePaymentsQuery)
  const { data: schedules, isLoading: schedulesLoading } = useCollection<ExamSchedule>(schedulesQuery)

  const isLoading = isUserRecordLoading || studentsLoading || teachersLoading || classesLoading || expensesLoading || deadStockLoading || feePaymentsLoading || schedulesLoading

  const performAction = (action: any, collectionName: string, docId?: string, data?: any) => {
    if (!firestore || !userData) return
    const schoolId = activeSchoolId || 'global'
    const colRef = collection(firestore, collectionName)
    const finalRef = docId ? doc(colRef, docId) : colRef
    
    if (data) {
        action(finalRef, { ...data, schoolId: schoolId })
        if (!docId && schoolId !== 'global') {
            const schoolRef = doc(firestore, 'schools', schoolId);
            if (collectionName === 'students') updateDoc(schoolRef, { studentCount: increment(1) }).catch(e => console.error(e));
            if (collectionName === 'teachers') updateDoc(schoolRef, { teacherCount: increment(1) }).catch(e => console.error(e));
        }
    } else {
        if (docId && schoolId !== 'global') {
            const schoolRef = doc(firestore, 'schools', schoolId);
            if (collectionName === 'students') updateDoc(schoolRef, { studentCount: increment(-1) }).catch(e => console.error(e));
            if (collectionName === 'teachers') updateDoc(schoolRef, { teacherCount: increment(-1) }).catch(e => console.error(e));
        }
        action(finalRef)
    }
  }

  return (
    <DataContext.Provider
      value={{
        students: students || [],
        teachers: teachers || [],
        classes: classes || [],
        expenses: expenses || [],
        deadStock: deadStock || [],
        feePayments: feePayments || [],
        examSchedules: schedules || [],
        isLoading,
        userData,
        impersonatedSchoolId,
        activeSchoolId,
        setImpersonatedSchoolId,
        addStudent: (data) => performAction(addDocumentNonBlocking, 'students', undefined, data),
        updateStudent: (data) => performAction(updateDocumentNonBlocking, 'students', data.id, data),
        deleteStudent: (id) => performAction(deleteDocumentNonBlocking, 'students', id),
        addTeacher: (data) => performAction(addDocumentNonBlocking, 'teachers', undefined, data),
        updateTeacher: (data) => performAction(updateDocumentNonBlocking, 'teachers', data.id, data),
        deleteTeacher: (id) => performAction(deleteDocumentNonBlocking, 'teachers', id),
        addClass: (data) => performAction(addDocumentNonBlocking, 'classes', undefined, data),
        updateClass: (data) => performAction(updateDocumentNonBlocking, 'classes', data.id, data),
        deleteClass: (id) => performAction(deleteDocumentNonBlocking, 'classes', id),
        addExpense: (data) => performAction(addDocumentNonBlocking, 'expenses', undefined, data),
        updateExpense: (data) => performAction(updateDocumentNonBlocking, 'expenses', data.id, data),
        deleteExpense: (id) => performAction(deleteDocumentNonBlocking, 'expenses', id),
        addDeadStock: (data) => performAction(addDocumentNonBlocking, 'dead_stock', undefined, data),
        updateDeadStock: (data) => performAction(updateDocumentNonBlocking, 'dead_stock', data.id, data),
        deleteDeadStock: (id) => performAction(deleteDocumentNonBlocking, 'dead_stock', id),
        addFeePayment: (data) => performAction(addDocumentNonBlocking, 'fees', undefined, data),
        addAttendance: (data) => performAction(addDocumentNonBlocking, 'attendance', undefined, data),
        addTeacherAttendance: (data) => performAction(addDocumentNonBlocking, 'teacher_attendance', undefined, data),
        addSmsLog: (data) => {
            if (!firestore || !activeSchoolId) return;
            const logRef = collection(firestore, 'sms_logs');
            addDocumentNonBlocking(logRef, { ...data, schoolId: activeSchoolId });
        },
        saveExamSchedule: (data) => {
            if (!firestore || !activeSchoolId) return;
            const ref = doc(firestore, 'exam_schedules', data.id);
            setDoc(ref, { ...data, schoolId: activeSchoolId, createdAt: new Date().toISOString() }, { merge: true });
        },
        deleteExamSchedule: (id) => {
            if (!firestore) return;
            deleteDocumentNonBlocking(doc(firestore, 'exam_schedules', id));
        }
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
