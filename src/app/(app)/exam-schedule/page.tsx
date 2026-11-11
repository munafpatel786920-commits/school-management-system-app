'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useData } from '@/context/data-context'
import { useSchoolProfile } from '@/context/school-profile-context'
import type { ExamSchedule, ExamScheduleItem } from '@/lib/types'
import { Plus, Trash2, Printer, Save, FileText, LayoutGrid, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { generateExamScheduleHtml, generateBulkExamSlipsHtml } from '@/lib/document-templates'
import { DocumentPreview } from '@/components/document-preview'

const handlePrint = (html: string) => {
  const win = window.open('', '', 'height=800,width=1000');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  }
}

export default function ExamSchedulePage() {
  const { classes: schoolClasses, students, examSchedules, saveExamSchedule, deleteExamSchedule, isLoading: dataLoading } = useData()
  const { schoolProfile } = useSchoolProfile()

  const [examName, setExamName] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [rows, setRows] = useState<ExamScheduleItem[]>([{ subject: '', date: '', time: '' }])
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const classOptions = useMemo(() => {
    const fromDefined = schoolClasses.map(c => c.sections.map(s => `${c.name} '${s}'`)).flat();
    const fromStudents = students
        .filter(s => s.status === 'Active' || !s.status)
        .map(s => `${s.class} '${s.section}'`);
    const combined = Array.from(new Set([...fromDefined, ...fromStudents]));
    return combined.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [schoolClasses, students]);

  const handleAddRow = () => setRows([...rows, { subject: '', date: '', time: '' }])
  
  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  }

  const handleUpdateRow = (index: number, field: keyof ExamScheduleItem, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  }

  const handleSave = () => {
    if (!examName || !selectedClass || rows.some(r => !r.subject || !r.date)) {
      toast({ variant: 'destructive', title: 'Invalid Data', description: 'Please fill all required fields.' });
      return;
    }

    const id = `${selectedClass}-${examName}`.replace(/\s+/g, '-').toLowerCase();
    saveExamSchedule({ id, examName, class: selectedClass, schedules: rows });
    toast({ title: 'Schedule Saved', description: `Time table for ${selectedClass} saved.` });
  }

  const handleLoadSchedule = (schedule: ExamSchedule) => {
    setExamName(schedule.examName);
    setSelectedClass(schedule.class);
    setRows(schedule.schedules);
    toast({ title: 'Schedule Loaded' });
  }

  const handlePrintMaster = () => {
    if (!examName || !selectedClass) return;
    const schedule: ExamSchedule = { id: 'temp', schoolId: 'temp', examName, class: selectedClass, schedules: rows, createdAt: '' };
    const html = generateExamScheduleHtml(schedule, schoolProfile as any);
    setGeneratedHtml(html);
    handlePrint(html);
  }

  const handlePrintBulkSlips = () => {
    if (!selectedClass || !examName) {
        toast({ variant: 'destructive', title: 'Selection Required', description: 'Select class and enter exam name.' });
        return;
    }
    const [cName, sQuote] = selectedClass.split(" '");
    const sect = sQuote.replace("'", '');
    const targetStudents = students.filter(s => s.class === cName && s.section === sect && s.status === 'Active');
    
    if (targetStudents.length === 0) {
        toast({ variant: 'destructive', title: 'No Students', description: 'No active students in this class.' });
        return;
    }

    const schedule: ExamSchedule = { id: 'temp', schoolId: 'temp', examName, class: selectedClass, schedules: rows, createdAt: '' };
    const html = generateBulkExamSlipsHtml(schedule, targetStudents, schoolProfile as any);
    handlePrint(html);
  }

  if (!isMounted || dataLoading) {
      return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="border-t-4 border-t-primary shadow-md">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                Time Table Designer
            </CardTitle>
            <CardDescription>Setup examination dates and subject slots.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Examination Title</Label>
                <Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. Annual Term 2025" className="font-bold border-2" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Target Audience</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="border-2 font-bold"><SelectValue placeholder="Select Class" /></SelectTrigger>
                  <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-2 rounded-xl overflow-hidden shadow-inner bg-muted/5">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase">Subject</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Timing</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-transparent">
                      <TableCell className="p-2"><Input className="h-9 text-xs font-medium border-none shadow-none" value={row.subject} onChange={e => handleUpdateRow(idx, 'subject', e.target.value)} placeholder="e.g. Science" /></TableCell>
                      <TableCell className="p-2"><Input className="h-9 text-xs border-none shadow-none" type="date" value={row.date} onChange={e => handleUpdateRow(idx, 'date', e.target.value)} /></TableCell>
                      <TableCell className="p-2"><Input className="h-9 text-xs border-none shadow-none" value={row.time} onChange={e => handleUpdateRow(idx, 'time', e.target.value)} placeholder="10 AM - 1 PM" /></TableCell>
                      <TableCell className="p-2"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveRow(idx)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="ghost" size="sm" className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-primary border-t rounded-none" onClick={handleAddRow}><Plus className="mr-1.5 h-3.5 w-3.5" /> Append Subject Row</Button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4">
              <Button onClick={handleSave} className="gap-2 font-bold"><Save className="h-4 w-4" /> Commit</Button>
              <Button onClick={handlePrintMaster} variant="secondary" className="gap-2 font-bold"><Printer className="h-4 w-4" /> Print Sheet</Button>
              <Button onClick={handlePrintBulkSlips} variant="outline" className="gap-2 font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50"><LayoutGrid className="h-4 w-4" /> Hall Tickets</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 border-b"><CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Registry Archives</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-4">
            {examSchedules?.length ? examSchedules.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <div className="space-y-0.5">
                  <p className="font-black text-sm text-foreground uppercase tracking-tight">{s.examName}</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Class {s.class} • {s.schedules.length} Papers Scheduled</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleLoadSchedule(s)} title="Restore to Editor"><FileText className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteExamSchedule(s.id)} title="Wipe Schedule"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            )) : <div className="text-center py-10 border-2 border-dashed rounded-xl opacity-20"><p className="text-[10px] font-black uppercase tracking-widest">Digital Archives Empty</p></div>}
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:block h-full">
        {generatedHtml ? (
          <DocumentPreview htmlContent={generatedHtml} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-12 border-2 border-dashed rounded-2xl bg-muted/5 opacity-40">
            <div className="p-6 bg-primary/10 rounded-full mb-6"><Printer className="h-16 w-16 text-primary" /></div>
            <h3 className="text-2xl font-black font-headline mb-3 uppercase tracking-tighter">Live Document Engine</h3>
            <p className="text-sm font-medium max-w-xs leading-relaxed">Design your schedule on the left to see a pixel-perfect A4 print preview here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
