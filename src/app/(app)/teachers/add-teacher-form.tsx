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
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type { Teacher } from '@/lib/types'
import { useRef, useEffect, useState } from 'react'
import { Upload, User, Camera } from 'lucide-react'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PhotoCapture } from '@/components/photo-capture'

const formSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  subject: z.string().min(2, "Subject is required."),
  mobile: z.string().min(10, 'Mobile number is required.'),
  email: z.string().email('Invalid email address.'),
  photoUrl: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
})

export function AddTeacherForm({
  teacher,
  onTeacherAdded,
  onTeacherUpdated,
  onCancel,
}: {
  teacher?: Teacher | null
  onTeacherAdded: (teacher: Omit<Teacher, 'id'>) => void
  onTeacherUpdated: (teacher: Teacher) => void
  onCancel: () => void
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      subject: '',
      mobile: '',
      email: '',
      photoUrl: '',
      status: 'Active',
    },
  })

  const [isCapturePhotoOpen, setIsCapturePhotoOpen] = useState(false)
  const photoUrlValue = form.watch('photoUrl')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!teacher;

  useEffect(() => {
    if (isEditing && teacher) {
        form.reset(teacher);
    } else {
        form.reset({ name: '', subject: '', mobile: '', email: '', photoUrl: '', status: 'Active' });
    }
  }, [teacher, isEditing, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing && teacher) {
        onTeacherUpdated({ ...teacher, ...values });
    } else {
        onTeacherAdded(values);
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Please select an image smaller than 2MB.",
        });
        if(fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('photoUrl', reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoCaptured = (imageDataUrl: string) => {
    form.setValue('photoUrl', imageDataUrl, { shouldValidate: true });
    setIsCapturePhotoOpen(false);
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormItem>
            <FormLabel>Teacher Photo</FormLabel>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                {photoUrlValue ? (
                  <Image
                    src={photoUrlValue}
                    alt="Teacher photo"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Attach Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCapturePhotoOpen(true)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capture Photo
                </Button>
              </div>
            </div>
            <FormMessage />
          </FormItem>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sunita Sharma" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mathematics" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
           {isEditing && (
              <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                  </Select>
                  <FormMessage />
                  </FormItem>
              )}
              />
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">{isEditing ? "Save Changes" : "Add Teacher"}</Button>
          </div>
        </form>
      </Form>
      <Dialog open={isCapturePhotoOpen} onOpenChange={setIsCapturePhotoOpen}>
        <DialogContent>
          <PhotoCapture
            onCapture={handlePhotoCaptured}
            onClose={() => setIsCapturePhotoOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
