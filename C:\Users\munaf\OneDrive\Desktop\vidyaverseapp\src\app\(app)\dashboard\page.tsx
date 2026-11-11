'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useData } from '@/context/data-context'
import { Activity, IndianRupee, Users } from 'lucide-react'
import { useMemo } from 'react'
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

function FeesSummaryChart({ data }: { data: any[] }) {
  const chartConfig = {
    collected: {
      label: 'Collected',
      color: 'hsl(var(--chart-2))',
    },
    pending: {
      label: 'Pending',
      color: 'hsl(var(--chart-5))',
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Class-wise Fee Summary</CardTitle>
        <CardDescription>Collected vs. Pending Fees</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} accessibilityLayer>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickFormatter={(value) => `₹${value / 1000}k`}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="collected"
                fill="var(--color-collected)"
                stackId="a"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="pending"
                fill="var(--color-pending)"
                stackId="a"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function DailyAttendanceChart({ data }: { data: any[] }) {
    const chartConfig = {
        students: {
        label: 'Students',
        },
        ...data.reduce((acc, cur) => {
            acc[cur.name] = { label: cur.name, color: cur.fill };
            return acc;
        }, {})
    } satisfies ChartConfig;

    return (
        <Card>
        <CardHeader>
            <CardTitle className="font-headline">Daily Student Attendance</CardTitle>
            <CardDescription>Present vs. Absent for active students today</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer
            config={chartConfig}
            className="min-h-[250px] w-full"
            >
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                 <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
            </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
        </Card>
    )
}

function DailyTeacherAttendanceChart({ data }: { data: any[] }) {
    const chartConfig = {
        teachers: {
        label: 'Teachers',
        },
        ...data.reduce((acc, cur) => {
            acc[cur.name] = { label: cur.name, color: cur.fill };
            return acc;
        }, {})
    } satisfies ChartConfig;

    return (
        <Card>
        <CardHeader>
            <CardTitle className="font-headline">Daily Teacher Attendance</CardTitle>
            <CardDescription>Present vs. Absent for active teachers today</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer
            config={chartConfig}
            className="min-h-[250px] w-full"
            >
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                 <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
            </ResponsiveContainer>
            </ChartContainer>
        </CardContent>
        </Card>
    )
}

function RecentExpenses({ data }: { data: Expense[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Recent Expenses</CardTitle>
                <CardDescription>The last 5 expenses recorded.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount (₹)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? data.map(expense => (
                            <TableRow key={expense.id}>
                                <TableCell>{format(new Date(expense.date), 'dd-MM-yyyy')}</TableCell>
                                <TableCell>{expense.category}</TableCell>
                                <TableCell className="text-right">{expense.amount.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No recent expenses found.
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
  const { students, teachers, expenses } = useData()
  const firestore = useFirestore()

  const todayString = format(new Date(), 'yyyy-MM-dd');
  const attendanceQuery = useMemoFirebase(
    () => (firestore) ? query(collection(firestore, 'attendance'), where('date', '==', todayString)) : null,
    [firestore, todayString]
  );
  const { data: attendanceToday } = useCollection<Attendance>(attendanceQuery);

  const teacherAttendanceQuery = useMemoFirebase(
    () => (firestore) ? query(collection(firestore, 'teacher_attendance'), where('date', '==', todayString)) : null,
    [firestore, todayString]
  );
  const { data: teacherAttendanceToday } = useCollection<TeacherAttendance>(teacherAttendanceQuery);


  const {
    totalStudents,
    totalTeachers,
    presentToday,
    absentToday,
    feesCollected,
    feesPending,
    feeSummaryByClass,
    dailyAttendanceData,
    dailyTeacherAttendanceData,
    recentExpenses
  } = useMemo(() => {
    // Student stats
    const activeStudents = students.filter(s => s.status === 'Active' || !s.status);
    const totalStudents = activeStudents.length
    const activeStudentIds = new Set(activeStudents.map(s => s.id));
    const activeStudentAttendanceToday = attendanceToday?.filter(a => activeStudentIds.has(a.studentId)) || [];
    const presentToday = activeStudentAttendanceToday.filter(a => a.status === 'present').length;
    const absentToday = activeStudentAttendanceToday.filter(a => a.status === 'absent').length;

    // Teacher stats
    const activeTeachers = teachers.filter(t => t.status === 'Active');
    const totalTeachers = activeTeachers.length
    const activeTeacherIds = new Set(activeTeachers.map(t => t.id));
    const activeTeacherAttendanceToday = teacherAttendanceToday?.filter(a => activeTeacherIds.has(a.teacherId)) || [];
    const presentTeachersToday = activeTeacherAttendanceToday.filter(a => a.status === 'present').length;
    const absentTeachersToday = activeTeacherAttendanceToday.filter(a => a.status === 'absent').length;

    // Fees stats
    const { feesCollected, feesPending } = students.reduce((acc, s) => {
        acc.feesCollected += s.feesPaid;
        acc.feesPending += s.totalFees - s.feesPaid;
        return acc;
    }, { feesCollected: 0, feesPending: 0 });

    const summary = activeStudents.reduce((acc, student) => {
        if(!acc[student.class]) {
            acc[student.class] = { name: `Class ${student.class}`, collected: 0, pending: 0 };
        }
        acc[student.class].collected += student.feesPaid;
        acc[student.class].pending += student.totalFees - student.feesPaid;
        return acc;
    }, {} as Record<string, {name: string, collected: number, pending: number}>);
    
    // Chart data
    const dailyAttendanceData = [
        { name: 'Present', value: presentToday, fill: 'hsl(var(--chart-2))' },
        { name: 'Absent', value: absentToday, fill: 'hsl(var(--chart-5))' }
    ].filter(item => item.value > 0);

    const dailyTeacherAttendanceData = [
        { name: 'Present', value: presentTeachersToday, fill: 'hsl(var(--chart-2))' },
        { name: 'Absent', value: absentTeachersToday, fill: 'hsl(var(--chart-5))' }
    ].filter(item => item.value > 0);

    // Expenses data
    const recentExpenses = expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);


    return {
      totalStudents,
      totalTeachers,
      presentToday,
      absentToday,
      feesCollected,
      feesPending,
      feeSummaryByClass: Object.values(summary),
      dailyAttendanceData,
      dailyTeacherAttendanceData,
      recentExpenses,
    }
  }, [students, teachers, attendanceToday, teacherAttendanceToday, expenses])


  return (
    <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold font-headline">{totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                    in the current academic year
                </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold font-headline">{totalTeachers}</div>
                <p className="text-xs text-muted-foreground">across all departments</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Student Attendance</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold font-headline">{presentToday}</div>
                <p className="text-xs text-muted-foreground">
                    {absentToday} absent
                </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fees Collection</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold font-headline">
                    ₹{feesCollected.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-muted-foreground">
                    ₹{feesPending.toLocaleString('en-IN')} pending
                </p>
                </CardContent>
            </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FeesSummaryChart data={feeSummaryByClass} />
            <DailyAttendanceChart data={dailyAttendanceData} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
           <DailyTeacherAttendanceChart data={dailyTeacherAttendanceData} />
           <RecentExpenses data={recentExpenses} />
        </div>
    </div>
  )
}

    