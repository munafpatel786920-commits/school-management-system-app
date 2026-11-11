export type Role = 'admin' | 'principal' | 'teacher' | 'accountant';

export type User = {
  id: string; // Firebase Auth UID
  email: string;
  role: Role;
};

export type SchoolProfile = {
  id: string;
  name: string;
  affiliationNo: string;
  schoolCode: string;
  udiseCode: string;
  address: string;
  logoUrl: string;
  principalName: string;
  academicYear: string;
};

export type Student = {
  id: string;
  grNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  class: string;
  section: string;
  rollNo: string;
  mobile: string;
  aadhaar?: string;
  photoUrl: string;
  status: 'Active' | 'LC Issued';
  feesPaid: number;
  totalFees: number;
  caste?: string;
  lastSchool?: string;
  lastSchoolYear?: string;
  lastSchoolPercentage?: string;
};

export type Teacher = {
  id: string;
  name: string;
  subject: string;
  mobile: string;
  email: string;
  photoUrl: string;
  status: 'Active' | 'Inactive';
};

export type SchoolClass = {
  id: string;
  name: string;
  sections: string[];
};

export type Attendance = {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: 'present' | 'absent';
  class: string;
};

export type TeacherAttendance = {
  id: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  status: 'present' | 'absent';
};

export type Expense = {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
};

export type DeadStock = {
  id: string;
  itemName: string;
  quantity: number;
  purchaseDate: string; // YYYY-MM-DD
  description: string;
  price?: number;
  status: 'In Stock' | 'Disposed' | 'Sold' | 'Written Off';
};

export type FeePayment = {
  id: string;
  studentId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  receiptNo: string;
};
