'use client'

import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Printer } from 'lucide-react'
import { useData } from '@/context/data-context'
import { Label } from '@/components/ui/label'
import { useSchoolProfile } from '@/context/school-profile-context'
import type { SchoolProfile } from '@/lib/types'
import { useFirestore } from '@/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import type { Attendance, TeacherAttendance } from '@/lib/types'
import { toast } from '@/hooks/use-toast'
import { format, startOfMonth, endOfMonth } from 'date-fns'


// Print helper with orientation
const handlePrint = (htmlContent: string, title: string, orientation: 'portrait' | 'landscape' = 'portrait') => {
  const printWindow = window.open('', '', 'height=800,width=1200')
  if (printWindow) {
    printWindow.document.write(`<html><head><title>${title}</title>`)
    printWindow.document.write(`
      <style>
        @media print {
          @page {
            size: ${orientation};
          }
        }
        body { font-family: sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 4px; text-align: center; font-size: 0.8rem; }
        th { background-color: #f2f2f2; }
        td:nth-child(2) { text-align: left; }
        @media print {
          .no-print { display: none; }
          body { margin: 0; }
        }
        .report-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 20px; }
        .report-header img { max-height: 60px; }
        .report-header .school-info { flex-grow: 1; }
        h1, h2, h3 { text-align: center; margin: 0; }
      </style>
    `)
    printWindow.document.write('</head><body>')
    printWindow.document.write(htmlContent)
    printWindow.document.write('</body></html>')
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}

// Due Report component
const DueFeesReport = ({ schoolProfile }: { schoolProfile: SchoolProfile}) => {
    const { students } = useData()
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const classes = useMemo(() => ['all', ...Array.from(new Set(students.map(s => s.class)))], [students]);

    const generateDueReport = () => {
        const studentsWithDues = students.filter(s => {
            const hasDues = s.totalFees > s.feesPaid;
            if (selectedClass === 'all') return hasDues;
            return hasDues && s.class === selectedClass;
        });

        let html = `<div class="report-header">
          ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" alt="logo">` : ''}
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <h2>Due Fees Report</h2>
            <h3>${selectedClass === 'all' ? 'All Classes' : `Class: ${selectedClass}`}</h3>
          </div>
        </div>`;
        html += `<table><thead><tr><th>Adm. No</th><th>Student Name</th><th>Class</th><th>Total Fees (₹)</th><th>Fees Paid (₹)</th><th>Pending Amount (₹)</th></tr></thead><tbody>`;

        let totalPending = 0;
        studentsWithDues.forEach(s => {
            const pending = s.totalFees - s.feesPaid;
            totalPending += pending;
            html += `<tr><td>${s.grNo}</td><td>${s.name}</td><td>${s.class} '${s.section}'</td><td>${s.totalFees.toLocaleString('en-IN')}</td><td>${s.feesPaid.toLocaleString('en-IN')}</td><td>${pending.toLocaleString('en-IN')}</td></tr>`;
        });

        html += `</tbody><tfoot><tr><th colspan="5" style="text-align:right;">Total Pending Amount</th><th>₹${totalPending.toLocaleString('en-IN')}</th></tr></tfoot></table>`;
        handlePrint(html, 'Due Fees Report', orientation);
    }

    return (
        <div className="space-y-4">
            <p>Generate a list of students with pending fee payments.</p>
            <div className="flex gap-4 items-end flex-wrap">
                <div className="w-full sm:w-[240px]">
                    <Label>Filter by Class</Label>
                    <Select onValueChange={setSelectedClass} value={selectedClass}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Classes' : `Class ${c}`}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-full sm:w-[150px]">
                    <Label>Orientation</Label>
                    <Select onValueChange={(v) => setOrientation(v as 'portrait' | 'landscape')} value={orientation}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={generateDueReport}><Printer className="mr-2 h-4 w-4" /> Generate & Print</Button>
            </div>
        </div>
    );
}


// All Fees Status Report
const AllFeesStatusReport = ({ schoolProfile }: { schoolProfile: SchoolProfile}) => {
    const { students } = useData();
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const classes = useMemo(() => ['all', ...Array.from(new Set(students.map(s => s.class)))], [students]);

    const generateReport = () => {
        const filteredStudents = students.filter(s => {
            if (selectedClass === 'all') return true;
            return s.class === selectedClass;
        });

        let html = `<div class="report-header">
          ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" alt="logo">` : ''}
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <h2>All Fees Status Report</h2>
            <h3>${selectedClass === 'all' ? 'All Classes' : `Class: ${selectedClass}`}</h3>
          </div>
        </div>`;
        html += `<table><thead><tr><th>GR No</th><th>Student Name</th><th>Class</th><th>Total Fees (₹)</th><th>Fees Paid (₹)</th><th>Pending Amount (₹)</th><th>Status</th></tr></thead><tbody>`;

        let totalFees = 0;
        let totalPaid = 0;
        let totalPending = 0;

        filteredStudents.sort((a,b) => a.class.localeCompare(b.class) || parseInt(a.rollNo) - parseInt(b.rollNo)).forEach(s => {
            const pending = s.totalFees - s.feesPaid;
            let status = 'Unpaid';
            if (pending <= 0) {
                status = 'Paid';
            } else if (s.feesPaid > 0) {
                status = 'Partially Paid';
            }

            totalFees += s.totalFees;
            totalPaid += s.feesPaid;
            totalPending += pending;

            html += `<tr><td>${s.grNo}</td><td>${s.name}</td><td>${s.class} '${s.section}'</td><td>${s.totalFees.toLocaleString('en-IN')}</td><td>${s.feesPaid.toLocaleString('en-IN')}</td><td>${pending > 0 ? pending.toLocaleString('en-IN') : 0}</td><td>${status}</td></tr>`;
        });

        html += `</tbody><tfoot>
            <tr><th colspan="3" style="text-align:right;">Grand Total</th><th>₹${totalFees.toLocaleString('en-IN')}</th><th>₹${totalPaid.toLocaleString('en-IN')}</th><th>₹${totalPending.toLocaleString('en-IN')}</th><th></th></tr>
        </tfoot></table>`;
        handlePrint(html, 'All Fees Status Report', orientation);
    }
    
    return (
        <div className="space-y-4">
             <p>Generate a complete fee status report for all students.</p>
             <div className="flex gap-4 items-end flex-wrap">
                 <div className="w-full sm:w-[240px]">
                    <Label>Filter by Class</Label>
                    <Select onValueChange={setSelectedClass} value={selectedClass}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Classes' : `Class ${c}`}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-full sm:w-[150px]">
                    <Label>Orientation</Label>
                    <Select onValueChange={(v) => setOrientation(v as 'portrait' | 'landscape')} value={orientation}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={generateReport}><Printer className="mr-2 h-4 w-4" /> Generate & Print</Button>
            </div>
        </div>
    );
}

// Attendance Report
const AttendanceReport = ({ schoolProfile }: { schoolProfile: SchoolProfile}) => {
    const { students, classes: schoolClasses } = useData()
    const firestore = useFirestore();
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i, name: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

    const classOptions = useMemo(() => {
        return schoolClasses.map(c => c.sections.map(s => `${c.name} '${s}'`)).flat();
    }, [schoolClasses]);

    const generateAttendanceReport = async () => {
        if (!selectedClass || !firestore) {
             toast({ variant: 'destructive', title: 'Error', description: 'Please select a class and ensure you are connected.' });
            return;
        }

        setIsGenerating(true);
        
        const [className, sectionWithQuote] = selectedClass.split(" '");
        const section = sectionWithQuote.replace("'", '');

        const studentsInClass = students.filter(s => s.class === className && s.section === section && s.status === 'Active').sort((a,b) => parseInt(a.rollNo) - parseInt(b.rollNo));
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = months[month].name;

        const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
        const endDate = format(new Date(year, month, daysInMonth), 'yyyy-MM-dd');
    
        const attendanceCol = collection(firestore, 'attendance');
        const q = query(attendanceCol, 
            where('date', '>=', startDate), 
            where('date', '<=', endDate)
        );

        try {
            const snapshot = await getDocs(q);
            const allAttendanceForMonth = snapshot.docs.map(doc => doc.data() as Omit<Attendance, 'id'>);
            const attendanceRecords = allAttendanceForMonth.filter(r => r.class === selectedClass);

            let html = `<div class="report-header">
              ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" alt="logo">` : ''}
              <div class="school-info">
                <h1>${schoolProfile.name}</h1>
                <h2>Student Attendance Report</h2>
                <h3>Class: ${className} '${section}' | Month: ${monthName} ${year}</h3>
              </div>
            </div>`;
            html += `<table style="font-size: 10px; table-layout: fixed; width: 100%;">`;
            html += `<thead><tr><th style="width: 40px;">Roll</th><th style="width: 120px; text-align: left;">Name</th>`;

            for (let day = 1; day <= daysInMonth; day++) {
                html += `<th style="width: 25px;">${day}</th>`;
            }
            html += `<th style="width: 40px;">Total P</th><th style="width: 40px;">Total A</th></tr></thead><tbody>`;

            studentsInClass.forEach(s => {
                let totalPresent = 0;
                let totalAbsent = 0;
                html += `<tr><td>${s.rollNo}</td><td style="text-align: left;">${s.name}</td>`;
                
                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
                    const attendanceRecord = attendanceRecords.find(r => r.studentId === s.id && r.date === dateStr);
                    
                    let status = '-';
                    if (attendanceRecord) {
                        if(attendanceRecord.status === 'present') {
                            status = 'P';
                            totalPresent++;
                        } else {
                            status = 'A';
                            totalAbsent++;
                        }
                    }
                    html += `<td>${status}</td>`;
                }
                html += `<td>${totalPresent}</td><td>${totalAbsent}</td></tr>`;
            });
            
            html += `</tbody></table>`;

            handlePrint(html, 'Monthly Student Attendance Report', 'landscape');

        } catch (error) {
            console.error("Failed to generate attendance report:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate report. Please check permissions.' });
        } finally {
            setIsGenerating(false);
        }
    }

     return (
        <div className="space-y-4">
             <p>Generate a monthly attendance report for a specific class.</p>
             <div className="flex gap-4 items-end flex-wrap">
                <div className="w-full sm:w-[150px]">
                    <Label>Select Month</Label>
                    <Select onValueChange={(val) => setMonth(Number(val))} value={String(month)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-full sm:w-[100px]">
                    <Label>Select Year</Label>
                    <Select onValueChange={(val) => setYear(Number(val))} value={String(year)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full sm:w-[240px]">
                    <Label>Select Class</Label>
                    <Select onValueChange={setSelectedClass} value={selectedClass}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                            {classOptions.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={generateAttendanceReport} disabled={!selectedClass || isGenerating}>
                    <Printer className="mr-2 h-4 w-4" /> 
                    {isGenerating ? 'Generating...' : 'Generate & Print'}
                </Button>
            </div>
        </div>
    );
}

// Muster Report
const MusterReport = ({ schoolProfile }: { schoolProfile: SchoolProfile}) => {
    const { teachers } = useData()
    const firestore = useFirestore();
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i, name: new Date(0, i).toLocaleString('default', { month: 'long' }) }));
    
    const generateMusterReport = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to database.' });
            return;
        }
        setIsGenerating(true);

        const activeTeachers = teachers.filter(t => t.status === 'Active');
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = months[month].name;

        const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd');
        const endDate = format(new Date(year, month, daysInMonth), 'yyyy-MM-dd');

        const attendanceCol = collection(firestore, 'teacher_attendance');
        const q = query(attendanceCol, 
            where('date', '>=', startDate), 
            where('date', '<=', endDate)
        );
        
        try {
            const snapshot = await getDocs(q);
            const attendanceRecords = snapshot.docs.map(doc => doc.data() as Omit<TeacherAttendance, 'id'>);

            let html = `<div class="report-header">
              ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" alt="logo">` : ''}
              <div class="school-info">
                <h1>${schoolProfile.name}</h1>
                <h2>Teacher Muster Report</h2>
                <h3>Month: ${monthName} ${year}</h3>
              </div>
            </div>`;
            html += `<table style="font-size: 10px; table-layout: fixed; width: 100%;"><thead><tr><th style="width: 150px; text-align: left;">Teacher Name</th><th style="width: 100px; text-align: left;">Subject</th>`;

            for (let day = 1; day <= daysInMonth; day++) {
                html += `<th style="width: 25px;">${day}</th>`;
            }
            html += `<th style="width: 40px;">Total P</th><th style="width: 40px;">Total A</th></tr></thead><tbody>`;

            activeTeachers.forEach(t => {
                let totalPresent = 0;
                let totalAbsent = 0;
                html += `<tr><td style="text-align: left;">${t.name}</td><td style="text-align: left;">${t.subject}</td>`;

                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
                    const attendanceRecord = attendanceRecords.find(r => r.teacherId === t.id && r.date === dateStr);
                    
                    let status = '-';
                    if (attendanceRecord) {
                        if (attendanceRecord.status === 'present') {
                            status = 'P';
                            totalPresent++;
                        } else {
                            status = 'A';
                            totalAbsent++;
                        }
                    }
                    html += `<td>${status}</td>`;
                }
                html += `<td>${totalPresent}</td><td>${totalAbsent}</td></tr>`;
            });

            html += `</tbody></table>`;
            handlePrint(html, 'Monthly Teacher Muster Report', 'landscape');
        } catch (error) {
            console.error("Failed to generate muster report:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate muster report.' });
        } finally {
            setIsGenerating(false);
        }
    }

     return (
        <div className="space-y-4">
             <p>Generate the monthly teacher attendance muster.</p>
             <div className="flex gap-4 items-end flex-wrap">
                 <div className="w-full sm:w-[150px]">
                    <Label>Select Month</Label>
                    <Select onValueChange={(val) => setMonth(Number(val))} value={String(month)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-full sm:w-[100px]">
                    <Label>Select Year</Label>
                    <Select onValueChange={(val) => setYear(Number(val))} value={String(year)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={generateMusterReport} disabled={isGenerating}>
                    <Printer className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Generate & Print'}
                </Button>
            </div>
        </div>
    );
}

const ExpenseReport = ({ schoolProfile }: { schoolProfile: SchoolProfile}) => {
    const { expenses } = useData();
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i, name: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

    const generateReport = () => {
        const reportDate = new Date(year, month);
        const reportMonth = startOfMonth(reportDate);
        const reportEndMonth = endOfMonth(reportDate);
        
        const filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= reportMonth && expenseDate <= reportEndMonth;
        });

        const monthName = months[month].name;

        let html = `<div class="report-header">
          ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" alt="logo">` : ''}
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <h2>Expense Report</h2>
            <h3>Month: ${monthName} ${year}</h3>
          </div>
        </div>`;
        html += `<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount (₹)</th></tr></thead><tbody>`;

        let totalAmount = 0;
        filteredExpenses.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(e => {
            totalAmount += e.amount;
            html += `<tr><td>${format(new Date(e.date), 'dd-MM-yyyy')}</td><td>${e.category}</td><td>${e.description}</td><td>${e.amount.toLocaleString('en-IN')}</td></tr>`;
        });

        html += `</tbody><tfoot><tr><th colspan="3" style="text-align:right;">Total Expenses</th><th>₹${totalAmount.toLocaleString('en-IN')}</th></tr></tfoot></table>`;
        handlePrint(html, 'Monthly Expense Report', 'portrait');
    }
    
    return (
        <div className="space-y-4">
             <p>Generate a monthly expense report.</p>
             <div className="flex gap-4 items-end flex-wrap">
                 <div className="w-full sm:w-[150px]">
                    <Label>Select Month</Label>
                    <Select onValueChange={(val) => setMonth(Number(val))} value={String(month)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="w-full sm:w-[100px]">
                    <Label>Select Year</Label>
                    <Select onValueChange={(val) => setYear(Number(val))} value={String(year)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={generateReport}>
                    <Printer className="mr-2 h-4 w-4" />
                    Generate & Print
                </Button>
            </div>
        </div>
    );
}

const DeadStockReport = ({ schoolProfile }: { schoolProfile: SchoolProfile}) => {
    const { deadStock } = useData();

    const generateReport = () => {
        let html = `<div class="report-header">
          ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" alt="logo">` : ''}
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <h2>Dead Stock Report</h2>
            <h3>As of ${format(new Date(), 'dd-MM-yyyy')}</h3>
          </div>
        </div>`;
        html += `<table><thead><tr><th>Item Name</th><th>Quantity</th><th>Purchase Date</th><th>Description</th><th>Unit Price (₹)</th><th>Total Price (₹)</th><th>Status</th></tr></thead><tbody>`;

        let grandTotal = 0;
        
        deadStock.sort((a,b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()).forEach(item => {
            const totalPrice = (item.price || 0) * item.quantity;
            grandTotal += totalPrice;
            html += `<tr><td>${item.itemName}</td><td>${item.quantity}</td><td>${format(new Date(item.purchaseDate), 'dd-MM-yyyy')}</td><td>${item.description || ''}</td><td style="text-align: right;">${(item.price || 0).toLocaleString('en-IN')}</td><td style="text-align: right;">${totalPrice.toLocaleString('en-IN')}</td><td>${item.status}</td></tr>`;
        });

        html += `</tbody><tfoot><tr><th colspan="5" style="text-align:right;">Grand Total</th><th style="text-align: right;">₹${grandTotal.toLocaleString('en-IN')}</th><th></th></tr></tfoot></table>`;
        handlePrint(html, 'Dead Stock Report', 'portrait');
    }
    
    return (
        <div className="space-y-4">
             <p>Generate a report of all dead stock items.</p>
             <div className="flex gap-4 items-end flex-wrap">
                <Button onClick={generateReport}>
                    <Printer className="mr-2 h-4 w-4" />
                    Generate & Print
                </Button>
            </div>
        </div>
    );
}

const BalanceSheetReport = ({ schoolProfile }: { schoolProfile: SchoolProfile}) => {
    const { expenses, deadStock, feePayments } = useData();
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [reportType, setReportType] = useState<'yearly' | 'monthly'>('yearly');

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i, name: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

    const generateReport = () => {
        const isYearly = reportType === 'yearly';
        const reportStartDate = isYearly ? new Date(year, 0, 1) : new Date(year, month, 1);
        const reportEndDate = isYearly ? new Date(year, 11, 31) : endOfMonth(new Date(year, month));
        const reportPeriodStr = isYearly ? `Year: ${year}` : `Month: ${months[month].name} ${year}`;
        
        // 1. Filter expenses for the period
        const filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= reportStartDate && expenseDate <= reportEndDate;
        });
        const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

        // 2. Filter fee payments for the period
        const filteredFeePayments = feePayments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= reportStartDate && paymentDate <= reportEndDate;
        });
        const totalFeesCollected = filteredFeePayments.reduce((acc, p) => acc + p.amount, 0);


        // 3. Calculate depreciated dead stock value
        let totalPurchaseValue = 0;
        let totalDepreciation = 0;

        deadStock.forEach(item => {
            const purchaseDate = new Date(item.purchaseDate);
            // Only consider items purchased before the end of the report period
            if (purchaseDate > reportEndDate) return;

            const purchaseValue = (item.price || 0) * item.quantity;
            totalPurchaseValue += purchaseValue;
            
            // Calculate age in years from purchase date to the end of the report period
            const ageInYears = (reportEndDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            
            if (ageInYears > 0) {
                 const depreciationForItem = purchaseValue * 0.10 * ageInYears;
                 totalDepreciation += depreciationForItem;
            }
        });
        
        const depreciatedDeadStockValue = Math.max(0, totalPurchaseValue - totalDepreciation);
        
        // 4. Calculate Net Profit/Loss
        const netProfitOrLoss = totalFeesCollected + depreciatedDeadStockValue - totalExpenses;
        const resultText = netProfitOrLoss >= 0 ? 'Net Profit' : 'Net Loss';
        const resultValue = Math.abs(netProfitOrLoss);

        let html = `<div class="report-header">
          ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" alt="logo">` : ''}
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <h2>Balance Sheet</h2>
            <h3>For the Period: ${reportPeriodStr}</h3>
          </div>
        </div>`;
        html += `<table style="font-size: 1.1rem; line-height: 2; width: 100%; margin-top: 20px;">
            <thead>
                <tr>
                    <th style="text-align: left; padding: 10px; border-bottom: 2px solid #000;">Particulars</th>
                    <th style="text-align: right; padding: 10px; border-bottom: 2px solid #000;">Amount (₹)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="text-align: left; padding: 10px;">Total Fees Collection (for the period)</td>
                    <td style="text-align: right; padding: 10px;">${totalFeesCollected.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td style="text-align: left; padding: 10px;">
                        Value of Dead Stock
                        <div style="font-size: 0.8rem; color: #555;">
                            (Purchase Value: ₹${totalPurchaseValue.toLocaleString('en-IN')} - Depreciation: ₹${totalDepreciation.toLocaleString('en-IN', {maximumFractionDigits: 2})})
                        </div>
                    </td>
                    <td style="text-align: right; padding: 10px;">${depreciatedDeadStockValue.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <td style="text-align: left; padding: 10px;">Total Expenses (for the period)</td>
                    <td style="text-align: right; padding: 10px;">(${totalExpenses.toLocaleString('en-IN')})</td>
                </tr>
            </tbody>
            <tfoot>
                <tr style="font-weight: bold; border-top: 2px solid #000;">
                    <td style="text-align: left; padding: 10px;">${resultText}</td>
                    <td style="text-align: right; padding: 10px;">${resultValue.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                </tr>
            </tfoot>
        </table>`;
        handlePrint(html, 'Balance Sheet', 'portrait');
    }
    
    return (
        <div className="space-y-4">
             <p>Generate a balance sheet with profit/loss calculation. Fee Collection and Expenses are filtered by the selected period.</p>
             <div className="flex gap-4 items-end flex-wrap">
                <div className="w-full sm:w-[120px]">
                    <Label>Report Type</Label>
                    <Select onValueChange={(v) => setReportType(v as 'yearly' | 'monthly')} value={reportType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="yearly">Yearly</SelectItem>
                           <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 {reportType === 'monthly' && (
                    <div className="w-full sm:w-[150px]">
                        <Label>Select Month</Label>
                        <Select onValueChange={(val) => setMonth(Number(val))} value={String(month)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                            {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                 )}
                 <div className="w-full sm:w-[100px]">
                    <Label>Select Year</Label>
                    <Select onValueChange={(val) => setYear(Number(val))} value={String(year)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={generateReport}>
                    <Printer className="mr-2 h-4 w-4" />
                    Generate & Print
                </Button>
            </div>
        </div>
    );
}

const ClassRegisterReport = ({ schoolProfile }: { schoolProfile: SchoolProfile}) => {
    const { students, classes: schoolClasses } = useData();
    const [selectedClass, setSelectedClass] = useState<string>('');

    const classOptions = useMemo(() => {
        return schoolClasses.map(c => c.sections.map(s => `${c.name} '${s}'`)).flat();
    }, [schoolClasses]);

    const generateReport = () => {
        if (!selectedClass) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a class.' });
            return;
        }

        const [className, sectionWithQuote] = selectedClass.split(" '");
        const section = sectionWithQuote.replace("'", '');
        
        const studentsInClass = students.filter(s => s.class === className && s.section === section && s.status === 'Active')
            .sort((a,b) => {
                const rollA = parseInt(a.rollNo);
                const rollB = parseInt(b.rollNo);
                if (!isNaN(rollA) && !isNaN(rollB)) {
                  return rollA - rollB;
                }
                return a.name.localeCompare(b.name);
            });
        
        if (studentsInClass.length === 0) {
            toast({ variant: 'destructive', title: 'No Students', description: 'No active students found in this class.' });
            return;
        }

        let html = `<div class="report-header">
          ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" alt="logo">` : ''}
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <h2>Class Register</h2>
            <h3>Class: ${selectedClass} | Session: ${schoolProfile.academicYear}</h3>
          </div>
        </div>`;
        html += `<style>td:nth-child(3), td:nth-child(4), td:nth-child(6) { text-align: left; }</style>`;
        html += `<table><thead><tr><th>Roll No.</th><th>GR No.</th><th>Student Name</th><th>Father's Name</th><th>Mobile No.</th><th>Address</th></tr></thead><tbody>`;

        studentsInClass.forEach(s => {
            html += `<tr><td>${s.rollNo || 'N/A'}</td><td>${s.grNo}</td><td>${s.name}</td><td>${s.fatherName}</td><td>${s.mobile}</td><td>${s.address}</td></tr>`;
        });

        html += `</tbody></table>`;
        handlePrint(html, `Class Register - ${selectedClass}`, 'portrait');
    }

    return (
        <div className="space-y-4">
             <p>Generate a printable register for a specific class.</p>
             <div className="flex gap-4 items-end flex-wrap">
                <div className="w-full sm:w-[240px]">
                    <Label>Select Class</Label>
                    <Select onValueChange={setSelectedClass} value={selectedClass}>
                        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                        <SelectContent>
                            {classOptions.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={generateReport} disabled={!selectedClass}>
                    <Printer className="mr-2 h-4 w-4" /> 
                    Generate & Print
                </Button>
            </div>
        </div>
    );
}


export default function ReportsPage() {
    const { schoolProfile } = useSchoolProfile();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Reports</CardTitle>
                <CardDescription>Generate and print various school reports.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="due-report" className="space-y-4">
                    <TabsList className="flex-wrap h-auto">
                        <TabsTrigger value="due-report">Due Fees Report</TabsTrigger>
                        <TabsTrigger value="fees-status-report">All Fees Status</TabsTrigger>
                        <TabsTrigger value="attendance-report">Attendance Report</TabsTrigger>
                        <TabsTrigger value="muster-report">Muster Report</TabsTrigger>
                        <TabsTrigger value="expense-report">Expense Report</TabsTrigger>
                        <TabsTrigger value="deadstock-report">Dead Stock Report</TabsTrigger>
                        <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
                        <TabsTrigger value="class-register">Class Register</TabsTrigger>
                    </TabsList>
                    <TabsContent value="due-report">
                        <Card>
                            <CardHeader><CardTitle className="font-headline text-lg">Due Fees Report</CardTitle></CardHeader>
                            <CardContent><DueFeesReport schoolProfile={schoolProfile} /></CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="fees-status-report">
                        <Card>
                            <CardHeader><CardTitle className="font-headline text-lg">All Fees Status Report</CardTitle></CardHeader>
                            <CardContent><AllFeesStatusReport schoolProfile={schoolProfile} /></CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="attendance-report">
                         <Card>
                            <CardHeader><CardTitle className="font-headline text-lg">Student Attendance Report</CardTitle></CardHeader>
                            <CardContent><AttendanceReport schoolProfile={schoolProfile} /></CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="muster-report">
                         <Card>
                            <CardHeader><CardTitle className="font-headline text-lg">Teacher Muster Report</CardTitle></CardHeader>
                            <CardContent><MusterReport schoolProfile={schoolProfile} /></CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="expense-report">
                         <Card>
                            <CardHeader><CardTitle className="font-headline text-lg">Expense Report</CardTitle></CardHeader>
                            <CardContent><ExpenseReport schoolProfile={schoolProfile} /></CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="deadstock-report">
                         <Card>
                            <CardHeader><CardTitle className="font-headline text-lg">Dead Stock Report</CardTitle></CardHeader>
                            <CardContent><DeadStockReport schoolProfile={schoolProfile} /></CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="balance-sheet">
                         <Card>
                            <CardHeader><CardTitle className="font-headline text-lg">Balance Sheet</CardTitle></CardHeader>
                            <CardContent><BalanceSheetReport schoolProfile={schoolProfile} /></CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="class-register">
                         <Card>
                            <CardHeader><CardTitle className="font-headline text-lg">Class Register</CardTitle></CardHeader>
                            <CardContent><ClassRegisterReport schoolProfile={schoolProfile} /></CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
