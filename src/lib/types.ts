
export type Role = 'super_admin' | 'school_admin' | 'teacher' | 'accountant';

export type PlanType = 'basic' | 'standard' | 'premium' | 'yearly' | 'lifetime';

export type SubscriptionPlan = {
  id: string;
  name: string;
  type: PlanType;
  studentLimit: number;
  monthlyPrice: number;
  features: string[];
};

export type SchoolStatus = 'active' | 'disabled' | 'expired';

export type ActivationKeyStatus = 'unused' | 'redeemed' | 'revoked';

export type ActivationKey = {
  id: string;
  key: string;
  planId: string;
  planName: string;
  durationDays: number; // e.g. 30, 90, 365, or 3650 for lifetime
  studentLimit: number;
  status: ActivationKeyStatus;
  customerName?: string;
  notes?: string;
  createdAt: string;
  redeemedByUid?: string;
  redeemedByEmail?: string;
  redeemedSchoolId?: string;
  redeemedSchoolName?: string;
  redeemedAt?: string;
};

export type School = {
  id: string;
  name: string;
  subdomain?: string;
  status: SchoolStatus;
  planId: string;
  expiryDate: string; // YYYY-MM-DD
  smsBalance: number;
  createdAt: string;
  adminEmail?: string;
  activationKeyId?: string;
  activationDate?: string;
  // Counters for SaaS tracking
  studentCount?: number;
  teacherCount?: number;
  // Profile info
  affiliationNo?: string;
  schoolCode?: string;
  udiseCode?: string;
  address?: string;
  logoUrl?: string;
  principalName?: string;
  academicYear?: string;
  phone?: string;
  educationBoard?: string;
  // Localization
  currency?: string; 
  currencySymbol?: string; 
  locale?: string; 
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
};

export type User = {
  id: string; // Firebase Auth UID
  email: string;
  role: Role;
  schoolId?: string; // Null for super_admin
  name?: string;
};

export type Student = {
  id: string;
  schoolId: string;
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
  schoolId: string;
  name: string;
  subject: string;
  mobile: string;
  email: string;
  photoUrl: string;
  status: 'Active' | 'Inactive';
};

export type SchoolClass = {
  id: string;
  schoolId: string;
  name: string;
  sections: string[];
};

export type Attendance = {
  id: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: 'present' | 'absent';
  class: string;
};

export type TeacherAttendance = {
  id: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  status: 'present' | 'absent';
};

export type Expense = {
  id: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
};

export type DeadStock = {
  id: string;
  schoolId: string;
  itemName: string;
  quantity: number;
  purchaseDate: string; // YYYY-MM-DD
  description: string;
  price?: number;
  status: 'In Stock' | 'Disposed' | 'Sold' | 'Written Off';
};

export type FeePayment = {
  id: string;
  schoolId: string;
  studentId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  receiptNo: string;
};

export type SmsLog = {
  id: string;
  schoolId: string;
  mobile: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed';
  cost: number;
};

export type ExamScheduleItem = {
  subject: string;
  date: string;
  time: string;
};

export type ExamSchedule = {
  id: string;
  schoolId: string;
  examName: string;
  class: string;
  schedules: ExamScheduleItem[];
  createdAt: string;
};
