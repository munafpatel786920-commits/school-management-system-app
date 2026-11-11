
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
import type { School, Attendance, TeacherAttendance } from '@/lib/types'
import { useFirestore } from '@/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

/**
 * Professional Global Report Generator
 */

const getRegionLabels = (locale: string = 'en-IN') => {
  const configs: Record<string, { regLabel: string; affLabel: string; idLabel: string }> = {
    'en-IN': { regLabel: 'U-DISE Code', affLabel: 'Affiliation No.', idLabel: 'GR No.' },
    'en-US': { regLabel: 'District ID', affLabel: 'Tax ID / EIN', idLabel: 'Student ID' },
    'en-GB': { regLabel: 'DfE Number', affLabel: 'Ofsted Reg No.', idLabel: 'Admin ID' },
    'en-AE': { regLabel: 'KHDA License', affLabel: 'MOE Registry', idLabel: 'SIS ID' },
  }
  return configs[locale] || configs['en-IN']
}

const handlePrint = (htmlContent: string, title: string, orientation: 'portrait' | 'landscape' = 'portrait') => {
  const printWindow = window.open('', '', 'height=800,width=1200')
  if (printWindow) {
    printWindow.document.write(`<html><head><title>${title}</title>`)
    printWindow.document.write(`
      <style>
        @media print {
          @page { size: ${orientation}; margin: 1cm; }
        }
        body { font-family: 'Segoe UI', sans-serif; margin: 20px; color: #333; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: fixed; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: center; font-size: 0.75rem; word-wrap: break-word; }
        th { background-color: #f1f1f1 !important; color: #1a237e !important; font-weight: bold; }
        .report-header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #1a237e; padding-bottom: 15px; margin-bottom: 25px; }
        .logo-box { width: 100px; text-align: left; }
        .logo-box img { max-height: 65px; max-width: 100px; object-fit: contain; }
        .school-info { flex: 1; text-align: center; }
        .school-info h1 { margin: 0; font-size: 22px; text-transform: uppercase; color: #1a237e; font-weight: 900; }
        .school-info p { margin: 2px 0; font-size: 10px; color: #666; font-weight: bold; }
        .reg-details { width: 150px; text-align: right; font-size: 9px; font-weight: bold; color: #444; }
        .report-title { text-align: center; font-weight: bold; background: #f0f4ff !important; padding: 10px; border-radius: 4px; margin: 15px 0; font-size: 14px; color: #1a237e; border: 1px solid #1a237e; }
        .summary-box { margin-top: 20px; padding: 15px; border: 1px solid #1a237e; background: #f0f4ff !important; text-align: right; font-weight: bold; color: #1a237e; border-radius: 6px; }
        .sun-col { background-color: #ffebee !important; }
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

const renderHeader = (schoolProfile: School, reportName: string) => {
    const labels = getRegionLabels(schoolProfile.locale);
    return `
        <div class="report-header">
            <div class="logo-box">${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}">` : ''}</div>
            <div class="school-info">
                <h1>${schoolProfile.name}</h1>
                <p>${schoolProfile.address}</p>
            </div>
            <div class="reg-details">
                <div>${labels.regLabel}: ${schoolProfile.udiseCode || 'N/A'}</div>
                <div>${labels.affLabel}: ${schoolProfile.affiliationNo || 'N/A'}</div>
                <div>Session: ${schoolProfile.academicYear}</div>
            </div>
        </div>
        <div class="report-title">${reportName.toUpperCase()}</div>
    `;
}

const MasterStudentRegistryReport = ({ schoolProfile }: { schoolProfile: School }) => {
    const { students } = useData()
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'LC Issued'>('all');
    const labels = getRegionLabels(schoolProfile.locale);

    const generateReport = () => {
        const list = students.filter(s => {
            const matchesClass = selectedClass === 'all' || s.class === selectedClass;
            const matchesStatus = statusFilter === 'all' || (s.status || 'Active') === statusFilter;
            return matchesClass && matchesStatus;
        }).sort((a,b) => a.class.localeCompare(b.class, undefined, {numeric: true}) || a.name.localeCompare(b.name));

        let html = renderHeader(schoolProfile, `Master Student Registry (${selectedClass.toUpperCase()})`);
        html += `<table><thead><tr><th style="width:40px">Sr</th><th style="width:80px">${labels.idLabel}</th><th style="text-align:left">Student Name</th><th>Class</th><th>Guardian</th><th>Mobile</th><th>Status</th></tr></thead><tbody>`;
        list.forEach((s, i) => {
            html += `<tr><td>${i+1}</td><td>${s.grNo}</td><td style="text-align:left; font-weight:bold;">${s.name}</td><td>${s.class} '${s.section}'</td><td>${s.fatherName}</td><td>${s.mobile}</td><td>${s.status || 'Active'}</td></tr>`;
        });
        html += `</tbody></table><div class="summary-box">Total Student Records: ${list.length}</div>`;
        handlePrint(html, 'Master Student Registry', 'landscape');
    }

    return (
        <div className="flex gap-4 items-end flex-wrap">
            <div className="w-[200px]"><Label>Grade</Label><Select onValueChange={setSelectedClass} value={selectedClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{Array.from(new Set(students.map(s => s.class))).sort().map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-[200px]"><Label>Status</Label><Select onValueChange={(v: any) => setStatusFilter(v)} value={statusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="LC Issued">LC Issued</SelectItem></SelectContent></Select></div>
            <Button onClick={generateReport}><Printer className="mr-2 h-4 w-4" /> Print Registry</Button>
        </div>
    );
}

const DueFeesReport = ({ schoolProfile }: { schoolProfile: School }) => {
    const { students } = useData()
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const currency = schoolProfile.currency || 'INR';
    const locale = schoolProfile.locale || 'en-IN';
    const fmt = new Intl.NumberFormat(locale, { style: 'currency', currency });

    const generateDueReport = () => {
        const list = students.filter(s => {
            const hasDues = (s.totalFees - s.feesPaid) > 0;
            return selectedClass === 'all' ? hasDues : hasDues && s.class === selectedClass;
        });

        let html = renderHeader(schoolProfile, `Outstanding Fee Report - ${selectedClass.toUpperCase()}`);
        html += `<table><thead><tr><th>Student Name</th><th>Class</th><th>Expected</th><th>Received</th><th>Dues</th></tr></thead><tbody>`;
        let totalDue = 0;
        list.forEach(s => {
            const due = s.totalFees - s.feesPaid; totalDue += due;
            html += `<tr><td style="text-align:left; font-weight:bold;">${s.name}</td><td>${s.class}</td><td>${fmt.format(s.totalFees)}</td><td>${fmt.format(s.feesPaid)}</td><td style="color:#d32f2f; font-weight:900;">${fmt.format(due)}</td></tr>`;
        });
        html += `</tbody></table><div class="summary-box">Total Outstanding Collection: ${fmt.format(totalDue)}</div>`;
        handlePrint(html, 'Due Fees Report', 'portrait');
    }

    return (
        <div className="flex gap-4 items-end">
            <div className="w-[240px]"><Label>Class</Label><Select onValueChange={setSelectedClass} value={selectedClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{Array.from(new Set(students.map(s => s.class))).sort().map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={generateDueReport}><Printer className="mr-2 h-4 w-4" /> Print Due List</Button>
        </div>
    );
}

const AllFeesStatusReport = ({ schoolProfile }: { schoolProfile: School }) => {
    const { students } = useData();
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const currency = schoolProfile.currency || 'INR';
    const fmt = new Intl.NumberFormat(schoolProfile.locale || 'en-IN', { style: 'currency', currency });

    const generateReport = () => {
        const list = students.filter(s => selectedClass === 'all' ? true : s.class === selectedClass);
        let html = renderHeader(schoolProfile, 'Global Fee Status Ledger');
        html += `<table><thead><tr><th>Name</th><th>Class</th><th>Expected</th><th>Received</th><th>Dues</th><th>Status</th></tr></thead><tbody>`;
        let tE = 0, tR = 0, tD = 0;
        list.forEach(s => {
            const due = s.totalFees - s.feesPaid; tE += s.totalFees; tR += s.feesPaid; tD += due;
            html += `<tr><td style="text-align:left">${s.name}</td><td>${s.class}</td><td>${fmt.format(s.totalFees)}</td><td>${fmt.format(s.feesPaid)}</td><td>${fmt.format(due)}</td><td>${due <= 0 ? 'PAID' : (s.feesPaid > 0 ? 'PARTIAL' : 'DUE')}</td></tr>`;
        });
        html += `</tbody></table><div class="summary-box">EXPECTED: ${fmt.format(tE)} | RECEIVED: ${fmt.format(tR)} | PENDING: ${fmt.format(tD)}</div>`;
        handlePrint(html, 'Fee Ledger', 'landscape');
    }
    
    return (
        <div className="flex gap-4 items-end">
            <div className="w-[240px]"><Label>Class Filter</Label><Select onValueChange={setSelectedClass} value={selectedClass}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Classes</SelectItem>{Array.from(new Set(students.map(s => s.class))).sort().map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={generateReport}><Printer className="mr-2 h-4 w-4" /> Print Ledger</Button>
        </div>
    );
}

const AttendanceReport = ({ schoolProfile }: { schoolProfile: School }) => {
    const { students, classes: schoolClasses, userData } = useData()
    const firestore = useFirestore();
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    const classOptions = useMemo(() => schoolClasses.map(c => c.sections.map(s => `${c.name} '${s}'`)).flat(), [schoolClasses]);

    const generateAttendanceReport = async () => {
        if (!selectedClass || !firestore || !userData?.schoolId) return;
        setIsGenerating(true);
        const days = new Date(year, month + 1, 0).getDate();
        const start = format(new Date(year, month, 1), 'yyyy-MM-dd');
        const end = format(new Date(year, month, days), 'yyyy-MM-dd');
    
        try {
            const snap = await getDocs(query(collection(firestore, 'attendance'), where('schoolId', '==', userData.schoolId)));
            const allRecords = snap.docs.map(doc => doc.data() as Omit<Attendance, 'id'>);
            const records = allRecords.filter(r => r.class === selectedClass && r.date >= start && r.date <= end);

            let html = renderHeader(schoolProfile, `Monthly Attendance Register - ${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`);
            html += `<table><thead><tr><th style="width:30px">Roll</th><th style="text-align:left; width:150px">Student Name</th>`;
            for (let d = 1; d <= days; d++) html += `<th style="width:25px">${d}</th>`;
            html += `<th style="width:35px">P</th><th style="width:35px">A</th></tr></thead><tbody>`;

            const targetStudents = students.filter(s => `${s.class} '${s.section}'` === selectedClass && s.status === 'Active').sort((a,b) => parseInt(a.rollNo) - parseInt(b.rollNo));
            targetStudents.forEach(s => {
                let p = 0, a = 0;
                html += `<tr><td>${s.rollNo}</td><td style="text-align:left">${s.name}</td>`;
                for (let d = 1; d <= days; d++) {
                    const dateStr = format(new Date(year, month, d), 'yyyy-MM-dd');
                    const r = records.find(rec => rec.studentId === s.id && rec.date === dateStr);
                    const status = r ? (r.status === 'present' ? 'P' : 'A') : '-';
                    if (status === 'P') p++; if (status === 'A') a++;
                    html += `<td>${status}</td>`;
                }
                html += `<td>${p}</td><td>${a}</td></tr>`;
            });
            html += `</tbody></table>`;
            handlePrint(html, 'Attendance Register', 'landscape');
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error' });
        } finally { setIsGenerating(false); }
    }

     return (
        <div className="flex gap-4 items-end flex-wrap">
            <div className="w-[150px]"><Label>Month</Label><Select onValueChange={(v) => setMonth(Number(v))} value={String(month)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({length:12}, (_, i) => <SelectItem key={i} value={String(i)}>{new Date(0, i).toLocaleString('default', {month:'long'})}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-[100px]"><Label>Year</Label><Select onValueChange={(v) => setYear(Number(v))} value={String(year)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-[200px]"><Label>Class</Label><Select onValueChange={setSelectedClass} value={selectedClass}><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger><SelectContent>{classOptions.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={generateAttendanceReport} disabled={!selectedClass || isGenerating}><Printer className="mr-2 h-4 w-4" /> Print Register</Button>
        </div>
    );
}

const ExpenseReport = ({ schoolProfile }: { schoolProfile: School }) => {
    const { expenses } = useData();
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const fmt = new Intl.NumberFormat(schoolProfile.locale || 'en-IN', { style: 'currency', currency: schoolProfile.currency || 'INR' });

    const generateReport = () => {
        const start = format(new Date(year, month, 1), 'yyyy-MM-dd');
        const end = format(new Date(year, month + 1, 0), 'yyyy-MM-dd');
        const list = expenses.filter(e => e.date >= start && e.date <= end);

        let html = renderHeader(schoolProfile, `Monthly Expense Statement - ${new Date(year, month).toLocaleString('default', {month:'long'})} ${year}`);
        html += `<table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>`;
        let total = 0;
        list.sort((a,b) => a.date.localeCompare(b.date)).forEach(e => {
            total += e.amount;
            html += `<tr><td>${format(new Date(e.date), 'dd-MM-yyyy')}</td><td>${e.category}</td><td style="text-align:left">${e.description}</td><td style="text-align:right">${fmt.format(e.amount)}</td></tr>`;
        });
        html += `</tbody></table><div class="summary-box">TOTAL EXPENDITURE: ${fmt.format(total)}</div>`;
        handlePrint(html, 'Expense Statement', 'portrait');
    }
    
    return (
        <div className="flex gap-4 items-end">
            <div className="w-[150px]"><Label>Month</Label><Select onValueChange={(v) => setMonth(Number(v))} value={String(month)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({length:12}, (_, i) => <SelectItem key={i} value={String(i)}>{new Date(0, i).toLocaleString('default', {month:'long'})}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-[100px]"><Label>Year</Label><Select onValueChange={(v) => setYear(Number(v))} value={String(year)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select></div>
            <Button onClick={generateReport}><Printer className="mr-2 h-4 w-4" /> Print Statement</Button>
        </div>
    );
}

export default function ReportsPage() {
    const { schoolProfile } = useSchoolProfile();

    return (
        <Card className="border-t-4 border-t-primary shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Institutional Records & Reports</CardTitle>
                <CardDescription>All reports are generated in professional school format with top-left logo alignment.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="db-registry" className="space-y-6">
                    <TabsList className="flex-wrap h-auto p-1 bg-muted border">
                        <TabsTrigger value="db-registry">Student Registry</TabsTrigger>
                        <TabsTrigger value="due-report">Outstanding Dues</TabsTrigger>
                        <TabsTrigger value="fees-status-report">Global Fee Ledger</TabsTrigger>
                        <TabsTrigger value="attendance-report">Attendance Register</TabsTrigger>
                        <TabsTrigger value="expense-report">Expense Statement</TabsTrigger>
                    </TabsList>
                    <TabsContent value="db-registry"><Card><CardContent className="pt-6"><MasterStudentRegistryReport schoolProfile={schoolProfile as School} /></CardContent></Card></TabsContent>
                    <TabsContent value="due-report"><Card><CardContent className="pt-6"><DueFeesReport schoolProfile={schoolProfile as School} /></CardContent></Card></TabsContent>
                    <TabsContent value="fees-status-report"><Card><CardContent className="pt-6"><AllFeesStatusReport schoolProfile={schoolProfile as School} /></CardContent></Card></TabsContent>
                    <TabsContent value="attendance-report"><Card><CardContent className="pt-6"><AttendanceReport schoolProfile={schoolProfile as School} /></CardContent></Card></TabsContent>
                    <TabsContent value="expense-report"><Card><CardContent className="pt-6"><ExpenseReport schoolProfile={schoolProfile as School} /></CardContent></Card></TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
