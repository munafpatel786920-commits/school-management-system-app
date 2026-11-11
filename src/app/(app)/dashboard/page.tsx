'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useData } from '@/context/data-context'
import { Activity, DollarSign, IndianRupee, Users, PieChart as PieIcon, BarChart3, Receipt, UserPlus, Coins, MessageSquare, Gift, ShieldCheck, School, Loader2 } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import { format } from 'date-fns'
import type { Attendance, TeacherAttendance, Expense } from '@/lib/types'
import { useSchoolProfile } from '@/context/school-profile-context'
import { formatMoney } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function FeesBarSection({ data, currencySymbol }: { data: any[], currencySymbol: string }) {
  const chartConfig = {
    collected: { label: 'Received', color: 'hsl(var(--chart-2))' },
    pending: { label: 'Due', color: 'hsl(var(--chart-5))' },
  } satisfies ChartConfig

  return (
    <Card className="shadow-sm border-muted h-full flex flex-col overflow-hidden">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-xs font-bold font-headline flex items-center gap-2 uppercase tracking-tight">
            <BarChart3 className="h-4 w-4 text-primary" /> Revenue by Class
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        {data.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={2} fontSize={10} />
                <YAxis 
                    tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? (v / 1000) + 'k' : v}`} 
                    tickLine={false} 
                    axisLine={false} 
                    fontSize={9} 
                    width={45} 
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="collected" fill="var(--color-collected)" stackId="a" radius={[2, 2, 0, 0]} barSize={20} />
                <Bar dataKey="pending" fill="var(--color-pending)" stackId="a" radius={[2, 2, 0, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
            </ChartContainer>
        ) : (
            <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold">No revenue data</div>
        )}
      </CardContent>
    </Card>
  )
}

function AttendancePieSection({ title, data, icon: Icon }: { title: string, data: any[], icon: any }) {
    const chartConfig = {
        value: { label: 'Total' },
        ...data.reduce((acc, cur) => {
            acc[cur.name] = { label: cur.name, color: cur.fill };
            return acc;
        }, {} as any)
    } satisfies ChartConfig;

    return (
        <Card className="shadow-sm border-muted h-full flex flex-col overflow-hidden">
        <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-bold font-headline flex items-center gap-2 uppercase tracking-tight">
                <Icon className="h-4 w-4 text-primary" /> {title}
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col justify-center overflow-hidden">
            {data.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-full w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="name" />} />
                    <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={65} strokeWidth={2} paddingAngle={4}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} className="text-[10px] mt-[-5px]" />
                    </PieChart>
                </ResponsiveContainer>
                </ChartContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold">No presence logs today</div>
            )}
        </CardContent>
        </Card>
    )
}

function ExpenseTableSection({ data, locale, currency }: { data: Expense[], locale: string, currency: string }) {
    return (
        <Card className="shadow-sm border-muted h-full flex flex-col overflow-hidden">
            <CardHeader className="p-3 pb-0">
                <CardTitle className="text-xs font-bold font-headline flex items-center gap-2 uppercase tracking-tight">
                    <Receipt className="h-4 w-4 text-primary" /> Recent Expenses
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="h-8 hover:bg-transparent border-b">
                            <TableHead className="text-[10px] h-8 px-3 font-black uppercase">Date</TableHead>
                            <TableHead className="text-[10px] h-8 px-3 font-black uppercase">Category</TableHead>
                            <TableHead className="text-right text-[10px] h-8 px-3 font-black uppercase">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? data.slice(0, 5).map(expense => (
                            <TableRow key={expense.id} className="h-10 hover:bg-muted/10 border-b last:border-0">
                                <TableCell className="text-[11px] h-10 px-3">{format(new Date(expense.date), 'dd MMM')}</TableCell>
                                <TableCell className="text-[11px] h-10 px-3 font-medium truncate max-w-[80px]">{expense.category}</TableCell>
                                <TableCell className="text-right text-[11px] h-10 px-3 font-bold text-red-600">{formatMoney(expense.amount, locale, currency)}</TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={3} className="h-32 text-center text-xs italic text-muted-foreground">
                                    No records.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
  const { students, teachers, expenses, userData, isLoading: dataLoading, impersonatedSchoolId } = useData()
  const { schoolProfile } = useSchoolProfile()
  const firestore = useFirestore()

  const [isMounted, setIsMounted] = useState(false)
  const [todayString, setTodayString] = useState('')
  const [todayMonthDay, setTodayMonthDay] = useState('')

  useEffect(() => {
    setIsMounted(true)
    const now = new Date()
    setTodayString(format(now, 'yyyy-MM-dd'))
    setTodayMonthDay(format(now, 'MM-dd'))
  }, [])

  const activeSchoolId = impersonatedSchoolId || userData?.schoolId;
  
  const currency = (schoolProfile as any)?.currency || 'USD';
  const currencySymbol = (schoolProfile as any)?.currencySymbol || '$';
  const locale = (schoolProfile as any)?.locale || 'en-US';
  const CurrencyIcon = currency === 'INR' ? IndianRupee : DollarSign;

  const attendanceQuery = useMemoFirebase(
    () => (firestore && activeSchoolId && todayString) ? query(
        collection(firestore, 'attendance'), 
        where('schoolId', '==', activeSchoolId),
        where('date', '==', todayString)
    ) : null,
    [firestore, activeSchoolId, todayString]
  );
  const { data: attendanceToday } = useCollection<Attendance>(attendanceQuery);

  const teacherAttendanceQuery = useMemoFirebase(
    () => (firestore && activeSchoolId && todayString) ? query(
        collection(firestore, 'teacher_attendance'), 
        where('schoolId', '==', activeSchoolId),
        where('date', '==', todayString)
    ) : null,
    [firestore, activeSchoolId, todayString]
  );
  const { data: teacherAttendanceToday } = useCollection<TeacherAttendance>(teacherAttendanceQuery);

  const stats = useMemo(() => {
    if (!isMounted || !todayString) return null;

    const activeStudents = students.filter(s => s.status === 'Active' || !s.status);
    const birthdaysToday = activeStudents.filter(s => s.dob && s.dob.includes(todayMonthDay));
    
    const activeStudentIds = new Set(activeStudents.map(s => s.id));
    const activeStudentAttendanceToday = attendanceToday?.filter(a => activeStudentIds.has(a.studentId)) || [];
    const presentToday = activeStudentAttendanceToday.filter(a => a.status === 'present').length;
    const absentToday = activeStudentAttendanceToday.filter(a => a.status === 'absent').length;

    const activeTeachers = teachers.filter(t => t.status === 'Active');
    const activeTeacherIds = new Set(activeTeachers.map(t => t.id));
    const activeTeacherAttendanceToday = teacherAttendanceToday?.filter(a => activeTeacherIds.has(a.teacherId)) || [];
    const presentTeachersToday = activeTeacherAttendanceToday.filter(a => a.status === 'present').length;
    const absentTeachersToday = activeTeacherAttendanceToday.filter(a => a.status === 'absent').length;

    const { feesCollected } = students.reduce((acc, s) => {
        acc.feesCollected += (s.feesPaid || 0);
        return acc;
    }, { feesCollected: 0 });

    const summary = activeStudents.reduce((acc, student) => {
        if(!acc[student.class]) {
            acc[student.class] = { name: `${student.class}`, collected: 0, pending: 0 };
        }
        acc[student.class].collected += (student.feesPaid || 0);
        acc[student.class].pending += ((student.totalFees || 0) - (student.feesPaid || 0));
        return acc;
    }, {} as Record<string, {name: string, collected: number, pending: number}>);
    
    const dailyAttendanceData = [
        { name: 'Present', value: presentToday, fill: 'hsl(var(--chart-2))' },
        { name: 'Absent', value: absentToday, fill: 'hsl(var(--chart-5))' }
    ].filter(item => item.value > 0);

    const dailyTeacherAttendanceData = [
        { name: 'Present', value: presentTeachersToday, fill: 'hsl(var(--chart-2))' },
        { name: 'Absent', value: absentTeachersToday, fill: 'hsl(var(--chart-5))' }
    ].filter(item => item.value > 0);

    return {
      totalStudents: activeStudents.length,
      totalTeachers: activeTeachers.length,
      presentToday,
      absentToday,
      feesCollected,
      birthdaysToday,
      feeSummaryByClass: Object.values(summary).sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true})).slice(0, 8),
      dailyAttendanceData,
      dailyTeacherAttendanceData,
      recentExpenses: [...expenses].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    }
  }, [students, teachers, attendanceToday, teacherAttendanceToday, expenses, todayMonthDay, isMounted, todayString])

  if (!isMounted || dataLoading) {
      return (
        <div className="flex h-[80vh] w-full items-center justify-center flex-col gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-headline text-sm font-bold tracking-widest text-primary uppercase">Initializing Dashboard...</p>
        </div>
      )
  }

  if (userData?.role === 'super_admin' && !impersonatedSchoolId) {
      return (
          <div className="flex h-[80vh] w-full items-center justify-center">
              <Card className="max-w-md border-dashed text-center p-12 bg-blue-50/30">
                  <div className="flex justify-center mb-6">
                      <div className="p-4 bg-blue-100 rounded-full">
                          <School className="h-12 w-12 text-blue-600" />
                      </div>
                  </div>
                  <CardTitle className="text-2xl font-headline mb-4">No Tenant Selected</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                      You are in Global Master mode. To view a school's operational dashboard, please select a tenant school from the sidebar dropdown.
                  </CardDescription>
                  <div className="mt-8">
                    <Link href="/super-admin">
                        <Button className="w-full gap-2">
                            <ShieldCheck className="h-4 w-4" /> Open Master Registry
                        </Button>
                    </Link>
                  </div>
              </Card>
          </div>
      )
  }

  if (!stats) return null;

  const quickActions = [
    { label: 'Enroll Student', href: '/students', icon: UserPlus },
    { label: 'Collect Fees', href: '/fees', icon: Coins },
    { label: 'Take Attendance', href: '/attendance', icon: Activity },
    { label: 'Send Alert', href: '/communication', icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col gap-4 w-full h-full max-w-full overflow-hidden p-0 animate-in fade-in duration-500">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full flex-shrink-0">
            <Card className="shadow-md border-muted h-24 flex items-center bg-card">
                <CardContent className="p-4 w-full flex items-center justify-between">
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Students</p><div className="text-3xl font-black font-headline leading-none">{stats.totalStudents}</div></div>
                    <div className="p-2 bg-primary/10 rounded-lg"><Users className="h-6 w-6 text-primary" /></div>
                </CardContent>
            </Card>
            <Card className="shadow-md border-muted h-24 flex items-center bg-card">
                <CardContent className="p-4 w-full flex items-center justify-between">
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Academic Staff</p><div className="text-3xl font-black font-headline leading-none">{stats.totalTeachers}</div></div>
                    <div className="p-2 bg-emerald-100 rounded-lg"><Users className="h-6 w-6 text-emerald-600" /></div>
                </CardContent>
            </Card>
            <Card className="shadow-md border-muted h-24 flex items-center bg-card">
                <CardContent className="p-4 w-full flex items-center justify-between">
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Presence Today</p><div className="text-3xl font-black font-headline leading-none text-amber-600">{stats.presentToday}</div></div>
                    <div className="p-2 bg-amber-100 rounded-lg"><Activity className="h-6 w-6 text-amber-600" /></div>
                </CardContent>
            </Card>
            <Card className="shadow-md border-muted h-24 flex items-center bg-card">
                <CardContent className="p-4 w-full flex items-center justify-between">
                    <div><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Received</p><div className="text-2xl font-black font-headline leading-none text-indigo-700">{formatMoney(stats.feesCollected, locale, currency)}</div></div>
                    <div className="p-2 bg-indigo-100 rounded-lg"><CurrencyIcon className="h-6 w-6 text-indigo-600" /></div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full flex-grow overflow-hidden">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <div className="h-[250px] overflow-hidden"><FeesBarSection data={stats.feeSummaryByClass} currencySymbol={currencySymbol} /></div>
                <div className="h-[250px] overflow-hidden"><AttendancePieSection title="Student Presence" data={stats.dailyAttendanceData} icon={PieIcon} /></div>
                <div className="h-[250px] overflow-hidden"><AttendancePieSection title="Staff Muster" data={stats.dailyTeacherAttendanceData} icon={Users} /></div>
                <div className="h-[250px] overflow-hidden"><ExpenseTableSection data={stats.recentExpenses} currency={currency} locale={locale} /></div>
            </div>

            <div className="space-y-4 flex flex-col">
                <Card className="shadow-sm border-muted">
                    <CardHeader className="p-3 pb-2"><CardTitle className="text-xs font-bold uppercase tracking-tight">Quick Actions</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-0 grid grid-cols-2 gap-2">
                        {quickActions.map(action => (
                            <Link key={action.label} href={action.href}>
                                <Button variant="outline" className="w-full h-16 flex-col gap-1 text-[10px] font-bold p-1 bg-muted/10 border-muted-foreground/10 hover:border-primary/50 hover:bg-primary/5">
                                    <action.icon className="h-4 w-4 text-primary" />
                                    {action.label}
                                </Button>
                            </Link>
                        ))}
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted flex-1 overflow-hidden bg-pink-50/10">
                    <CardHeader className="p-3 pb-2 flex-shrink-0"><CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-tight"><Gift className="h-4 w-4 text-pink-500" /> Celebrations Today</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2 overflow-y-auto max-h-[300px]">
                        {stats.birthdaysToday.length > 0 ? stats.birthdaysToday.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-pink-100 shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold">{s.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Class {s.class}</span>
                                </div>
                                <Gift className="h-3 w-3 text-pink-400" />
                            </div>
                        )) : (
                            <div className="py-10 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-2 opacity-50">
                                <Gift className="h-8 w-8 text-muted-foreground/20" />
                                <span>No birthdays today</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  )
}