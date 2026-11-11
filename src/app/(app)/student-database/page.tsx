'use client'

import Image from 'next/image'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useData } from '@/context/data-context'
import type { Student } from '@/lib/types'
import { Edit, Eye, Trash2, Search, FilterX, UserCircle, Database, MessageCircle } from 'lucide-react'
import { AddStudentForm, type StudentFormData } from '../students/add-student-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { useSchoolProfile } from '@/context/school-profile-context'
import { cn, getRegionLabels, formatMoney } from '@/lib/utils'

function StudentFullDetails({ student, locale }: { student: Student, locale: string }) {
  const labels = getRegionLabels(locale);
  const currency = locale === 'en-IN' ? 'INR' : 'USD';

  const DetailRow = ({ label, value }: { label: string, value: string | number | undefined }) => (
    <div className="flex flex-col py-2 border-b last:border-0 border-muted/50">
      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
      <span className="text-sm font-bold text-foreground">{value || 'N/A'}</span>
    </div>
  );

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-6 p-4 bg-muted/20 rounded-2xl border">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg shrink-0">
            <Image
                alt="portrait"
                fill
                className="object-cover"
                src={student.photoUrl || 'https://picsum.photos/seed/student/200'}
            />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-black font-headline tracking-tight leading-tight">{student.name}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className="bg-primary text-primary-foreground font-bold">CLASS {student.class}</Badge>
            <Badge variant="outline" className="font-bold">SECT {student.section}</Badge>
            <Badge variant={student.status === 'Active' ? 'default' : 'destructive'} className="font-bold">
                {student.status?.toUpperCase() || 'ACTIVE'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 px-1">
        <DetailRow label={labels.idLabel} value={student.grNo} />
        <DetailRow label="Roll Number" value={student.rollNo} />
        <DetailRow label="Gender" value={student.gender} />
        <DetailRow label="Birth Date" value={new Date(student.dob).toLocaleDateString(locale, { dateStyle: 'medium' })} />
        <DetailRow label="Contact" value={student.mobile} />
        <DetailRow label={labels.nationalId} value={student.aadhaar} />
        <DetailRow label="Father Name" value={student.fatherName} />
        <DetailRow label="Mother Name" value={student.motherName} />
        <DetailRow label="Caste/Category" value={student.caste} />
      </div>

      <Card className="bg-blue-50/30 border-blue-100">
        <CardContent className="pt-4 grid grid-cols-2 gap-4">
            <DetailRow label="Total Annual Fees" value={formatMoney(student.totalFees, locale, currency)} />
            <DetailRow label="Total Fees Paid" value={formatMoney(student.feesPaid, locale, currency)} />
        </CardContent>
      </Card>

      <div className="px-1">
        <DetailRow label="Residential Address" value={student.address} />
      </div>
    </div>
  )
}

export default function StudentDatabasePage() {
  const { students, updateStudent, deleteStudent, isLoading, classes: schoolClasses } = useData()
  const { schoolProfile } = useSchoolProfile()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'LC Issued'>('All')
  const [classFilter, setSelectedClass] = useState<string>('All')
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  
  const locale = schoolProfile?.locale || 'en-IN';
  const labels = getRegionLabels(locale);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesStatus = statusFilter === 'All' || (s.status || 'Active') === statusFilter;
      const matchesClass = classFilter === 'All' || s.class === classFilter;
      const matchesSearch = searchQuery === '' || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.grNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNo?.includes(searchQuery);

      return matchesStatus && matchesClass && matchesSearch;
    }).sort((a, b) => a.class.localeCompare(b.class, undefined, {numeric: true}) || a.name.localeCompare(b.name));
  }, [students, searchQuery, statusFilter, classFilter])

  const handleUpdateStudent = (updatedStudent: Student) => {
    updateStudent(updatedStudent);
    toast({ title: 'Record Updated', description: `${updatedStudent.name}'s profile has been saved.` })
    setEditingStudent(null)
  }

  const handleDelete = (id: string) => {
    deleteStudent(id);
    toast({ variant: 'destructive', title: 'Record Deleted', description: 'Student data removed from database.' })
  }

  const handleWhatsApp = (mobile: string) => {
    let phone = mobile.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    window.open(`https://wa.me/${phone}`, '_blank');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight text-foreground flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            Student Master Database
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Complete academic registry including current and alumni records.</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-primary shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Universal Search</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search by Name, ${labels.idLabel} or Roll No...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 border-2 focus-visible:ring-primary"
                    />
                </div>
            </div>
            
            <div className="w-full md:w-48 space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Status Filter</Label>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="h-10 border-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Students</SelectItem>
                        <SelectItem value="Active">Active Only</SelectItem>
                        <SelectItem value="LC Issued">LC Issued Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full md:w-48 space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Class Grade</Label>
                <Select value={classFilter} onValueChange={setSelectedClass}>
                    <SelectTrigger className="h-10 border-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Classes</SelectItem>
                        {schoolClasses.map(c => <SelectItem key={c.id} value={c.name}>Class {c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <Button variant="ghost" onClick={() => { setSearchQuery(''); setStatusFilter('All'); setSelectedClass('All'); }} className="h-10 px-3 hover:bg-red-50 text-red-600 font-bold uppercase text-[10px] gap-1.5">
                <FilterX className="h-4 w-4" /> Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-hidden shadow-inner bg-muted/5">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Name & Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Class / Sect</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">{labels.idLabel}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest hidden md:table-cell">Contact</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow><TableCell colSpan={6} className="h-32 text-center font-bold text-primary animate-pulse uppercase tracking-widest">Syncing Records...</TableCell></TableRow>
                ) : filteredStudents.length > 0 ? (
                   filteredStudents.map((s) => (
                    <TableRow key={s.id} className={cn("hover:bg-muted/30 transition-colors", s.status === 'LC Issued' && "opacity-70 bg-slate-50")}>
                    <TableCell>
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border bg-background shrink-0">
                            <Image alt="img" fill className="object-cover" src={s.photoUrl || 'https://picsum.photos/seed/student/100'} />
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="font-bold text-sm text-foreground">{s.name}</div>
                        <Badge variant={s.status === 'Active' ? 'default' : 'destructive'} className="text-[8px] h-4 px-1 leading-none uppercase font-black">
                            {s.status || 'Active'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="font-black text-sm text-primary">Class {s.class}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Section {s.section}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold tracking-tighter">{s.grNo}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        <Button variant="ghost" size="sm" onClick={() => handleWhatsApp(s.mobile)} className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 font-bold">
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </Button>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => setViewingStudent(s)} title="View Full Profile">
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => setEditingStudent(s)} title="Edit Record">
                                <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" title="Delete Permanent">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-4 border-destructive">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-destructive font-black uppercase tracking-tight">CRITICAL ACTION: DELETE STUDENT</AlertDialogTitle>
                                        <AlertDialogDescription className="font-bold">
                                            This will permanently remove <strong>{s.name}</strong> from the database. 
                                            History, grades, and fee records for this student will be lost forever.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="font-bold">Abort</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-destructive text-white font-bold">WIPE RECORD</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="h-40 text-center flex flex-col items-center justify-center gap-3 opacity-40">
                    <UserCircle className="h-12 w-12" />
                    <p className="text-sm font-black uppercase tracking-widest">No Database Matches</p>
                </TableCell></TableRow>
              )}
            </TableBody>
            {filteredStudents.length > 0 && (
                <tfoot className="bg-muted/30 border-t">
                    <tr>
                        <td colSpan={6} className="p-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">
                            End of Registry • Showing {filteredStudents.length} Students
                        </td>
                    </tr>
                </tfoot>
            )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* VIEW DIALOG */}
      <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
        <DialogContent className="sm:max-w-2xl">
          {viewingStudent && (
            <>
              <DialogHeader><DialogTitle className="font-headline text-xl flex items-center gap-2 uppercase tracking-tight"><UserCircle className="h-5 w-5 text-primary" /> Master Profile View</DialogTitle></DialogHeader>
              <StudentFullDetails student={viewingStudent} locale={locale} />
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingStudent(null)}>Close</Button>
                <Button onClick={() => { setViewingStudent(null); setEditingStudent(viewingStudent); }} className="gap-2"><Edit className="h-4 w-4" /> Edit Profile</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl uppercase tracking-tight">Database Record Modification</DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <AddStudentForm
                student={editingStudent}
                onStudentAdded={() => {}} // Not used here
                onStudentUpdated={handleUpdateStudent}
                onCancel={() => setEditingStudent(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
