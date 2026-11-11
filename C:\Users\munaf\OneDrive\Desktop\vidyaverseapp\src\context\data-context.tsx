'use client'

import React, {
  createContext,
  useContext,
  ReactNode,
} from 'react'
import type { Student, Teacher, SchoolClass, Expense, DeadStock, FeePayment } from '@/lib/types'
import {
  useFirestore,
  useCollection,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase'
import { collection, doc } from 'firebase/firestore'

interface DataContextType {
  students: Student[]
  teachers: Teacher[]
  classes: SchoolClass[]
  expenses: Expense[]
  deadStock: DeadStock[]
  feePayments: FeePayment[]
  isLoading: boolean
  addStudent: (student: Omit<Student, 'id'>) => void
  updateStudent: (student: Student) => void
  deleteStudent: (studentId: string) => void
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void
  updateTeacher: (teacher: Teacher) => void
  deleteTeacher: (teacherId: string) => void
  addClass: (schoolClass: Omit<SchoolClass, 'id'>) => void
  updateClass: (schoolClass: SchoolClass) => void
  deleteClass: (classId: string) => void
  addExpense: (expense: Omit<Expense, 'id'>) => void
  updateExpense: (expense: Expense) => void
  deleteExpense: (expenseId: string) => void
  addDeadStock: (item: Omit<DeadStock, 'id'>) => void
  updateDeadStock: (item: DeadStock) => void
  deleteDeadStock: (itemId: string) => void
  addFeePayment: (payment: Omit<FeePayment, 'id'>) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore()

  // Memoize collection references
  const studentsColRef = useMemoFirebase(() => firestore ? collection(firestore, 'students') : null, [firestore]);
  const teachersColRef = useMemoFirebase(() => firestore ? collection(firestore, 'teachers') : null, [firestore]);
  const classesColRef = useMemoFirebase(() => firestore ? collection(firestore, 'classes') : null, [firestore]);
  const expensesColRef = useMemoFirebase(() => firestore ? collection(firestore, 'expenses') : null, [firestore]);
  const deadStockColRef = useMemoFirebase(() => firestore ? collection(firestore, 'dead_stock') : null, [firestore]);
  const feePaymentsColRef = useMemoFirebase(() => firestore ? collection(firestore, 'fees') : null, [firestore]);
  
  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsColRef);
  const { data: teachers, isLoading: teachersLoading } = useCollection<Teacher>(teachersColRef);
  const { data: classes, isLoading: classesLoading } = useCollection<SchoolClass>(classesColRef);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesColRef);
  const { data: deadStock, isLoading: deadStockLoading } = useCollection<DeadStock>(deadStockColRef);
  const { data: feePayments, isLoading: feePaymentsLoading } = useCollection<FeePayment>(feePaymentsColRef);

  const isLoading = studentsLoading || teachersLoading || classesLoading || expensesLoading || deadStockLoading || feePaymentsLoading;

  const performAction = (action: (docRef: any, data?: any) => void, colRef: any, docId?: string, data?: any) => {
    if (!colRef) return;
    const finalRef = docId ? doc(colRef, docId) : colRef;
    if (data) {
        action(finalRef, data);
    } else {
        action(finalRef);
    }
  }

  // Student Operations
  const addStudent = (studentData: Omit<Student, 'id'>) => performAction(addDocumentNonBlocking, studentsColRef, undefined, studentData);
  const updateStudent = (studentData: Student) => performAction(updateDocumentNonBlocking, studentsColRef, studentData.id, studentData);
  const deleteStudent = (studentId: string) => performAction(deleteDocumentNonBlocking, studentsColRef, studentId);
  
  // Teacher Operations
  const addTeacher = (teacherData: Omit<Teacher, 'id'>) => performAction(addDocumentNonBlocking, teachersColRef, undefined, teacherData);
  const updateTeacher = (teacherData: Teacher) => performAction(updateDocumentNonBlocking, teachersColRef, teacherData.id, teacherData);
  const deleteTeacher = (teacherId: string) => performAction(deleteDocumentNonBlocking, teachersColRef, teacherId);

  // Class Operations
  const addClass = (classData: Omit<SchoolClass, 'id'>) => performAction(addDocumentNonBlocking, classesColRef, undefined, classData);
  const updateClass = (classData: SchoolClass) => performAction(updateDocumentNonBlocking, classesColRef, classData.id, classData);
  const deleteClass = (classId: string) => performAction(deleteDocumentNonBlocking, classesColRef, classId);
  
  // Expense Operations
  const addExpense = (expenseData: Omit<Expense, 'id'>) => performAction(addDocumentNonBlocking, expensesColRef, undefined, expenseData);
  const updateExpense = (expenseData: Expense) => performAction(updateDocumentNonBlocking, expensesColRef, expenseData.id, expenseData);
  const deleteExpense = (expenseId: string) => performAction(deleteDocumentNonBlocking, expensesColRef, expenseId);

  // Dead Stock Operations
  const addDeadStock = (itemData: Omit<DeadStock, 'id'>) => performAction(addDocumentNonBlocking, deadStockColRef, undefined, itemData);
  const updateDeadStock = (itemData: DeadStock) => performAction(updateDocumentNonBlocking, deadStockColRef, itemData.id, itemData);
  const deleteDeadStock = (itemId: string) => performAction(deleteDocumentNonBlocking, deadStockColRef, itemId);

  // Fee Payment Operations
  const addFeePayment = (paymentData: Omit<FeePayment, 'id'>) => performAction(addDocumentNonBlocking, feePaymentsColRef, undefined, paymentData);

  return (
    <DataContext.Provider
      value={{
        students: students || [],
        teachers: teachers || [],
        classes: classes || [],
        expenses: expenses || [],
        deadStock: deadStock || [],
        feePayments: feePayments || [],
        isLoading,
        addStudent,
        updateStudent,
        deleteStudent,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addClass,
        updateClass,
        deleteClass,
        addExpense,
        updateExpense,
        deleteExpense,
        addDeadStock,
        updateDeadStock,
        deleteDeadStock,
        addFeePayment,
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
