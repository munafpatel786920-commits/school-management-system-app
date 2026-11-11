'use client'

import { useState, useMemo } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Wand2,
  ChevronDown,
  Contact,
  BrainCircuit,
  ShieldCheck,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useSchoolProfile } from '@/context/school-profile-context'
import { toast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import {
  generateConsolidatedFeeReceipt,
  generateBonafideCertificate,
  generateIdCard,
  generateLeavingCertificate,
  generateAdmissionForm,
  generateBulkIdCardsHtml,
  generateExamAdmitCard,
  generateBulkExamPassesHtml,
} from '@/lib/document-templates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentGeneratorForm } from './document-generator-form'

function StudentDocumentGenerator({
  onDocumentGenerated,
}: {
  onDocumentGenerated: (html: string) => void
}) {
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const { schoolProfile } = useSchoolProfile()
  const { students, updateStudent } = useData()

  const classes = useMemo(() => {
    const activeStudents = students.filter(s => s.status === 'Active' || !s.status)
    const allClasses = activeStudents.map((s) => `${s.class} '${s.section}'`)
    return [...new Set(allClasses)].sort()
  }, [students])

  const handleClassChange = (value: string) => {
    setSelectedClass(value)
    setSearchQuery('')
  }

  const studentsInClass = useMemo(() => {
    if (!selectedClass) return []
    const [className, sectionWithQuote] = selectedClass.split(" '")
    const section = sectionWithQuote.replace("'", '')
    let filteredStudents = students.filter(
      (s) => s.class === className && s.section === section
    )

    if (searchQuery) {
      filteredStudents = filteredStudents.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.grNo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filteredStudents.sort(
      (a, b) => parseInt(a.rollNo) - parseInt(b.rollNo)
    )
  }, [selectedClass, searchQuery, students])

  const handleGenerateDocument = (student: Student, docType: string) => {
    let html = ''
    const profile = schoolProfile as any;

    if (docType === 'Leaving Certificate') {
      const pendingFees = student.totalFees - student.feesPaid
      if (pendingFees > 0) {
        toast({
          variant: 'destructive',
          title: 'Fee Dues Pending',
          description: `${
            student.name
          } has pending fees. Please clear the dues before issuing an LC.`,
        })
        return
      }

      if (student.status === 'LC Issued') {
        html = generateLeavingCertificate(student, profile, true)
        toast({
          title: 'Duplicate LC Generated',
          description: `A duplicate Leaving Certificate has been generated for ${student.name}.`,
        })
      } else {
        html = generateLeavingCertificate(student, profile, false)
        updateStudent({ ...student, status: 'LC Issued' })
        toast({
          title: 'LC Issued',
          description: `${student.name}'s status has been updated to 'LC Issued'.`,
        })
      }
    } else if (docType === 'Fee Receipt') {
      html = generateConsolidatedFeeReceipt(student, profile)
    } else if (docType === 'Bonafide Certificate') {
      html = generateBonafideCertificate(student, profile)
    } else if (docType === 'ID Card') {
      html = generateIdCard(student, profile)
    } else if (docType === 'Admission Form') {
      html = generateAdmissionForm(student, profile)
    } else if (docType === 'Exam Pass') {
      html = generateExamAdmitCard(student, profile)
    }
    onDocumentGenerated(html)
  }

  const handleGenerateBulkIdCards = () => {
    if (studentsInClass.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Students',
        description:
          'There are no students in the selected class to generate ID cards for.',
      })
      return
    }

    const html = generateBulkIdCardsHtml(studentsInClass, schoolProfile as any)
    onDocumentGenerated(html)
    toast({
      title: 'Bulk ID Cards Generated',
      description: `ID cards for all ${studentsInClass.length} students in the class are ready for printing.`,
    })
  }

  const handleGenerateBulkExamPasses = () => {
    if (studentsInClass.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Students',
        description:
          'There are no students in the selected class to generate Exam Passes for.',
      })
      return
    }

    const html = generateBulkExamPassesHtml(studentsInClass, schoolProfile as any)
    onDocumentGenerated(html)
    toast({
      title: 'Bulk Exam Passes Generated',
      description: `Hall tickets for all ${studentsInClass.length} students in the class are ready.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">
          Student Document Generator
        </CardTitle>
        <CardDescription>
          Select a class to see students and generate pre-defined documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Select onValueChange={handleClassChange} value={selectedClass}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c} value={c}>
                  Class {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[240px]"
            disabled={!selectedClass}
          />
          <div className="flex gap-2">
            <Button
                onClick={handleGenerateBulkIdCards}
                disabled={!selectedClass}
                variant="outline"
                size="sm"
            >
                <Contact className="mr-2 h-4 w-4" />
                Class ID Cards
            </Button>
            <Button
                onClick={handleGenerateBulkExamPasses}
                disabled={!selectedClass}
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Class Exam Passes
            </Button>
          </div>
        </div>

        {selectedClass ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsInClass.length > 0 ? (
                  studentsInClass.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.rollNo}</TableCell>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === 'Active' || !student.status
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {student.status || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Generate{' '}
                              <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleGenerateDocument(student, 'Exam Pass')
                              }
                            >
                              Exam Admit Card
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleGenerateDocument(student, 'Fee Receipt')
                              }
                            >
                              Fee Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleGenerateDocument(
                                  student,
                                  'Bonafide Certificate'
                                )
                              }
                            >
                              Bonafide Certificate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleGenerateDocument(student, 'ID Card')
                              }
                            >
                              ID Card
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleGenerateDocument(
                                  student,
                                  'Leaving Certificate'
                                )
                              }
                            >
                              Leaving Certificate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleGenerateDocument(
                                  student,
                                  'Admission Form'
                                )
                              }
                            >
                              Admission Form
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No students found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg h-[400px]">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-headline text-foreground mb-2">
              Select a class to begin
            </h3>
            <p className="text-muted-foreground max-w-xs">
              Once you pick a class, the list of students will appear here for
              you to generate their documents.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DocumentGenerationPage() {
  const [generatedHtml, setGeneratedHtml] = useState('')

  const handleTabChange = () => {
    setGeneratedHtml('')
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        {generatedHtml ? (
          <DocumentPreview htmlContent={generatedHtml} />
        ) : (
          <Card className="h-full">
            <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Wand2 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-headline text-foreground mb-2">
                Document Preview
              </h3>
              <p className="text-muted-foreground max-w-sm">
                Select a document type to generate a preview. The preview will
                appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <div>
        <Tabs
          defaultValue="student"
          className="w-full"
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">
              {' '}
              <FileText className="mr-2 h-4 w-4" /> Student Templates
            </TabsTrigger>
            <TabsTrigger value="ai">
              {' '}
              <BrainCircuit className="mr-2 h-4 w-4" /> AI Generator
            </TabsTrigger>
          </TabsList>
          <TabsContent value="student" className="mt-6">
            <StudentDocumentGenerator onDocumentGenerated={setGeneratedHtml} />
          </TabsContent>
          <TabsContent value="ai" className="mt-6">
            <DocumentGeneratorForm onDocumentGenerated={setGeneratedHtml} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
