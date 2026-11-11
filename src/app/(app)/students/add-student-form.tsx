'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { Student } from '@/lib/types'
import { useRef, useState, useEffect } from 'react'
import { Upload, User, Camera } from 'lucide-react'
import Image from 'next/image'
import { useData } from '@/context/data-context'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PhotoCapture } from '@/components/photo-capture'
import { useSchoolProfile } from '@/context/school-profile-context'
import { getRegionLabels } from '@/lib/utils'

export const formSchema = z.object({
  grNo: z.string().min(1, 'Required.'),
  name: z.string().min(2, 'Required.'),
  fatherName: z.string().min(2, "Required."),
  motherName: z.string().min(2, "Required."),
  dob: z.string().min(1, 'Required.'),
  gender: z.enum(['Male', 'Female', 'Other']),
  address: z.string().min(5, 'Required.'),
  class: z.string().min(1, 'Required.'),
  section: z.string().min(1, 'Required.'),
  rollNo: z.string().optional(),
  mobile: z.string().min(10, 'Required.'),
  aadhaar: z.string().optional(),
  caste: z.string().optional(),
  lastSchool: z.string().optional(),
  lastSchoolYear: z.string().optional(),
  lastSchoolPercentage: z.string().optional(),
  photoUrl: z.string().optional(),
  totalFees: z.coerce.number().min(0),
})

export type StudentFormData = z.infer<typeof formSchema>;

export function AddStudentForm({
  student,
  onStudentAdded,
  onStudentUpdated,
  onCancel,
}: {
  student?: Student | null
  onStudentAdded: (student: StudentFormData) => void
  onStudentUpdated: (student: Student) => void
  onCancel: () => void
}) {
  const { classes, students } = useData()
  const { schoolProfile } = useSchoolProfile()
  const locale = schoolProfile?.locale || 'en-IN'
  const labels = getRegionLabels(locale)

  const form = useForm<StudentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grNo: '',
      name: '',
      fatherName: '',
      motherName: '',
      dob: '',
      gender: 'Male',
      address: '',
      class: '',
      section: '',
      rollNo: '',
      mobile: '',
      aadhaar: '',
      caste: '',
      lastSchool: '',
      lastSchoolYear: '',
      lastSchoolPercentage: '',
      photoUrl: '',
      totalFees: 0,
    },
  })
  
  const [sections, setSections] = useState<string[]>([])
  const [isCapturePhotoOpen, setIsCapturePhotoOpen] = useState(false)
  const photoUrlValue = form.watch('photoUrl')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const isEditing = !!student;

  useEffect(() => {
    if (isEditing && student) {
        form.reset({
          ...student,
          grNo: student.grNo,
          rollNo: student.rollNo || '',
          totalFees: student.totalFees || 0,
        });
        const selectedClass = classes.find(c => c.name === student.class);
        setSections(selectedClass ? selectedClass.sections : []);
    } else {
        const nextGrNo = (students.reduce((max, s) => Math.max(max, parseInt(s.grNo) || 0), 0) + 1).toString().padStart(5, '0');
        form.reset({
          grNo: nextGrNo,
          gender: 'Male',
          totalFees: 0,
        });
        setSections([]);
    }
  }, [student, isEditing, form, classes, students]);

  const handleClassChange = (className: string) => {
    form.setValue('class', className);
    const selectedClass = classes.find(c => c.name === className);
    setSections(selectedClass ? selectedClass.sections : []);
    form.setValue('section', '');
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => form.setValue('photoUrl', reader.result as string, { shouldValidate: true });
      reader.readAsDataURL(file);
    }
  };

  const onValidSubmit = (data: StudentFormData) => {
    if (isEditing && student) {
      onStudentUpdated({ ...student, ...data });
    } else {
      onStudentAdded(data);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onValidSubmit)} className="space-y-6">
          <div className="flex items-center gap-6 p-4 bg-muted/20 rounded-xl border">
              <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center overflow-hidden border-4 border-primary/20">
                {photoUrlValue ? (
                  <Image src={photoUrlValue} alt="photo" width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Upload
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setIsCapturePhotoOpen(true)}>
                  <Camera className="h-4 w-4" /> Live Photo
                </Button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Legal Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="grNo" render={({ field }) => (
                <FormItem><FormLabel>{labels.idLabel}</FormLabel><FormControl><Input {...field} readOnly className="bg-muted font-mono" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={form.control} name="class" render={({ field }) => (
                <FormItem><FormLabel>Grade / Class</FormLabel>
                  <Select onValueChange={handleClassChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
            )} />
            <FormField control={form.control} name="section" render={({ field }) => (
                <FormItem><FormLabel>Section</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={sections.length === 0}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>{sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </FormItem>
            )} />
            <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                  </Select>
                </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="dob" render={({ field }) => (
                <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="mobile" render={({ field }) => (
                <FormItem><FormLabel>Primary Contact No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="fatherName" render={({ field }) => (
                <FormItem><FormLabel>Father / Guardian 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="motherName" render={({ field }) => (
                <FormItem><FormLabel>Mother / Guardian 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="aadhaar" render={({ field }) => (
                <FormItem><FormLabel>{labels.nationalId}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="totalFees" render={({ field }) => (
                <FormItem><FormLabel>Agreed Annual Fees</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>Permanent Residential Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="px-8">{isEditing ? "Save Changes" : "Confirm Enrollment"}</Button>
          </div>
        </form>
      </Form>
      <Dialog open={isCapturePhotoOpen} onOpenChange={setIsCapturePhotoOpen}>
        <DialogContent><PhotoCapture onCapture={(img) => { form.setValue('photoUrl', img); setIsCapturePhotoOpen(false); }} onClose={() => setIsCapturePhotoOpen(false)} /></DialogContent>
      </Dialog>
    </>
  )
}
