'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useData } from '@/context/data-context'
import type { Student } from '@/lib/types'
import { DocumentPreview } from '@/components/document-preview'
import { FileCheck, Plus, Trash2, Wand2, Sparkles, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSchoolProfile } from '@/context/school-profile-context'
import { toast } from '@/hooks/use-toast'
import { generateMarksheetHtml } from '@/lib/document-templates'
import { generateRemarksAction } from './actions'

type Mark = {
  id: number
  subject: string
  theoryMax: string
  theoryGot: string
  practicalMax: string
  practicalGot: string
  internalMax: string
  internalGot: string
}

export default function ExamPage() {
  const { students, classes: schoolClasses } = useData()
  const { schoolProfile } = useSchoolProfile()

  const [examName, setExamName] = useState('Annual Examination 2024-25')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [remarks, setRemarks] = useState('')
  const [isGeneratingRemarks, setIsGeneratingRemarks] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  const [marks, setMarks] = useState<Mark[]>([
    { id: 1, subject: 'English', theoryMax: '80', theoryGot: '', practicalMax: '0', practicalGot: '', internalMax: '20', internalGot: '' },
    { id: 2, subject: 'Mathematics', theoryMax: '80', theoryGot: '', practicalMax: '0', practicalGot: '', internalMax: '20', internalGot: '' },
    { id: 3, subject: 'Science', theoryMax: '70', theoryGot: '', practicalMax: '10', practicalGot: '', internalMax: '20', internalGot: '' },
  ])
  const [generatedHtml, setGeneratedHtml] = useState('')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const classOptions = useMemo(() => {
    return schoolClasses.map(c => c.sections.map(s => `${c.name} '${s}'`)).flat();
  }, [schoolClasses]);

  const studentsInClass = useMemo(() => {
    if (!selectedClass) return []
    const [className, sectionWithQuote] = selectedClass.split(" '")
    const section = sectionWithQuote.replace("'", '')
    return students.filter(s => s.class === className && s.section === section && (s.status === 'Active' || !s.status))
      .sort((a, b) => parseInt(a.rollNo || '0') - parseInt(b.rollNo || '0'))
  }, [selectedClass, students])

  const handleAddSubject = useCallback(() => {
    setMarks(prev => [...prev, { id: Date.now(), subject: '', theoryMax: '80', theoryGot: '', practicalMax: '0', practicalGot: '', internalMax: '20', internalGot: '' }])
  }, [])

  const handleRemoveSubject = useCallback((id: number) => {
    if (marks.length <= 1) return;
    setMarks(prev => prev.filter((m) => m.id !== id))
  }, [marks.length])

  const handleMarkChange = (id: number, field: keyof Omit<Mark, 'id'>, value: string) => {
    setMarks(prevMarks => prevMarks.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
  }

  const handleGenerateRemarks = async () => {
    const student = students.find(s => s.id === selectedStudentId)
    if (!student) return

    setIsGeneratingRemarks(true)
    try {
        const totalMax = marks.reduce((sum, m) => sum + (Number(m.theoryMax) + Number(m.practicalMax) + Number(m.internalMax)), 0)
        const totalGot = marks.reduce((sum, m) => sum + (Number(m.theoryGot) + Number(m.practicalGot) + Number(m.internalGot)), 0)
        const percentage = totalMax > 0 ? (totalGot / totalMax) * 100 : 0

        const result = await generateRemarksAction({
            studentName: student.name,
            overallPercentage: percentage,
            marks: marks.map(m => ({ 
                subject: m.subject, 
                score: Number(m.theoryGot) + Number(m.practicalGot) + Number(m.internalGot), 
                max: Number(m.theoryMax) + Number(m.practicalMax) + Number(m.internalMax) 
            }))
        })

        if (result.success) {
            setRemarks(result.remarks)
            toast({ title: 'AI Remark Generated', description: 'Student analysis complete.' })
        }
    } catch (e) {
        console.error("AI Remarks generation failed:", e);
        toast({ variant: 'destructive', title: 'AI Offline' })
    } finally {
        setIsGeneratingRemarks(false)
    }
  }

  const handleGenerateMarksheet = () => {
    const student = students.find((s) => s.id === selectedStudentId)
    if (!student) {
      toast({ variant: 'destructive', title: 'Selection Missing', description: 'Please pick a student to generate marksheet.' })
      return
    }
    const html = generateMarksheetHtml(student, schoolProfile as any, examName, marks, remarks)
    setGeneratedHtml(html)
    toast({ title: 'Marksheet Generated', description: 'Preview is ready for printing.' })
  }

  if (!isMounted) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* PREVIEW COLUMN */}
      <div className="order-2 lg:order-1">
        {generatedHtml ? (
          <DocumentPreview htmlContent={generatedHtml} />
        ) : (
          <Card className="h-full border-dashed border-2 bg-muted/5">
            <CardContent className="flex flex-col items-center justify-center h-full text-center p-12 opacity-40">
              <div className="p-6 bg-primary/10 rounded-full mb-6">
                <FileCheck className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-2xl font-black font-headline mb-3 uppercase tracking-tighter">Result Preview</h3>
              <p className="text-sm font-medium max-w-xs leading-relaxed">Enter student scores on the right to see a live A4 print preview here.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* DATA ENTRY COLUMN */}
      <Card className="order-1 lg:order-2 shadow-lg border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Marksheet Designer
          </CardTitle>
          <CardDescription>Setup examination scores and generate professional results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Exam Title</label>
              <Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="e.g. Annual Term 2025" className="font-bold border-2" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grade Class</label>
              <Select onValueChange={setSelectedClass} value={selectedClass}>
                <SelectTrigger className="border-2 font-bold"><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>{classOptions.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Candidate</label>
            <Select onValueChange={setSelectedStudentId} value={selectedStudentId} disabled={!selectedClass}>
              <SelectTrigger className="border-2 font-black text-primary"><SelectValue placeholder="Choose a student from class list..." /></SelectTrigger>
              <SelectContent>{studentsInClass.map(s => <SelectItem key={s.id} value={s.id}>{s.rollNo ? `${s.rollNo}. ` : ''}{s.name} ({s.grNo})</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* MARKS ENTRY TABLE */}
          <div className="border-2 rounded-xl overflow-hidden shadow-inner bg-muted/5">
            <div className="bg-muted/50 grid grid-cols-12 gap-2 p-2 border-b text-[10px] font-black uppercase text-muted-foreground text-center items-center">
                <div className="col-span-4 text-left pl-2">Subject Name</div>
                <div className="col-span-2">Theory (Got/Max)</div>
                <div className="col-span-2">Pract (Got/Max)</div>
                <div className="col-span-2">Intr (Got/Max)</div>
                <div className="col-span-2">Action</div>
            </div>
            <div className="max-h-[450px] overflow-y-auto">
                {marks.map((mark) => (
                  <div key={mark.id} className="grid grid-cols-12 gap-2 p-3 items-center border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <div className="col-span-4">
                      <Input 
                        value={mark.subject} 
                        onChange={(e) => handleMarkChange(mark.id, 'subject', e.target.value)} 
                        className="h-10 text-xs font-bold border-2 focus-visible:ring-primary px-2" 
                        placeholder="Subject e.g. English" 
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                        <Input type="number" value={mark.theoryGot} onChange={(e) => handleMarkChange(mark.id, 'theoryGot', e.target.value)} className="h-9 w-full text-xs text-center p-1 border-blue-200 focus-visible:ring-blue-500" placeholder="0" />
                        <Input type="number" value={mark.theoryMax} onChange={(e) => handleMarkChange(mark.id, 'theoryMax', e.target.value)} className="h-9 w-full text-xs text-center p-1 bg-muted border-none" />
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                        <Input type="number" value={mark.practicalGot} onChange={(e) => handleMarkChange(mark.id, 'practicalGot', e.target.value)} className="h-9 w-full text-xs text-center p-1 border-emerald-200 focus-visible:ring-emerald-500" placeholder="0" />
                        <Input type="number" value={mark.practicalMax} onChange={(e) => handleMarkChange(mark.id, 'practicalMax', e.target.value)} className="h-9 w-full text-xs text-center p-1 bg-muted border-none" />
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                        <Input type="number" value={mark.internalGot} onChange={(e) => handleMarkChange(mark.id, 'internalGot', e.target.value)} className="h-9 w-full text-xs text-center p-1 border-amber-200 focus-visible:ring-amber-500" placeholder="0" />
                        <Input type="number" value={mark.internalMax} onChange={(e) => handleMarkChange(mark.id, 'internalMax', e.target.value)} className="h-9 w-full text-xs text-center p-1 bg-muted border-none" />
                    </div>
                    <div className="col-span-2 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveSubject(mark.id)} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
            <Button variant="ghost" size="sm" onClick={handleAddSubject} className="w-full h-12 text-[10px] uppercase font-black tracking-widest text-primary border-t rounded-none bg-muted/10 hover:bg-muted/30">
              <Plus className="mr-1.5 h-4 w-4" /> Append Subject Row
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Evaluator Feedback</label>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateRemarks} 
                    disabled={!selectedStudentId || isGeneratingRemarks} 
                    className="h-8 text-[9px] uppercase font-black tracking-tighter text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1.5 px-3"
                >
                    {isGeneratingRemarks ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {isGeneratingRemarks ? 'AI Analysis in Progress...' : 'AI Performance Remark'}
                </Button>
            </div>
            <Textarea 
                value={remarks} 
                onChange={e => setRemarks(e.target.value)} 
                placeholder="Type overall remarks here or use AI to generate based on scores..." 
                className="text-sm min-h-[100px] border-2 focus-visible:ring-indigo-500" 
            />
          </div>

          <Button onClick={handleGenerateMarksheet} className="w-full h-16 text-lg font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 bg-primary text-primary-foreground">
            <FileCheck className="mr-2 h-6 w-6" /> Commit & Generate Result
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
