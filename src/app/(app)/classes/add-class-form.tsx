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
import type { SchoolClass } from '@/lib/types'
import { useEffect } from 'react'

const formSchema = z.object({
  name: z.string().min(1, 'Class name is required.'),
  sections: z.string().min(1, 'At least one section is required.'),
})

export function AddClassForm({
  schoolClass,
  onClassAdded,
  onClassUpdated,
  onCancel,
}: {
  schoolClass?: SchoolClass | null,
  onClassAdded: (schoolClass: Omit<SchoolClass, 'id'>) => void
  onClassUpdated: (schoolClass: SchoolClass) => void
  onCancel: () => void
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: schoolClass?.name || '',
      sections: schoolClass?.sections.join(', ') || '',
    },
  })

  useEffect(() => {
    if (schoolClass) {
        form.reset({
            name: schoolClass.name,
            sections: schoolClass.sections.join(', '),
        })
    } else {
        form.reset({ name: '', sections: '' })
    }
  }, [schoolClass, form])

  const isEditing = !!schoolClass;

  function onSubmit(values: z.infer<typeof formSchema>) {
    const sectionsArray = values.sections.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (sectionsArray.length === 0) {
        form.setError('sections', { message: 'Please provide at least one valid section.' });
        return;
    }
    
    if (isEditing && schoolClass) {
        onClassUpdated({
            id: schoolClass.id,
            name: values.name,
            sections: sectionsArray
        })
         toast({
            title: 'Class Updated',
            description: `Class ${values.name} has been updated.`,
        })
    } else {
        onClassAdded({
            name: values.name,
            sections: sectionsArray,
        })
        toast({
            title: 'Class Added',
            description: `Class ${values.name} has been added.`,
        })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 9th" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sections"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sections</FormLabel>
              <FormControl>
                <Input placeholder="e.g., A, B, C" {...field} />
              </FormControl>
               <p className="text-sm text-muted-foreground">
                Enter section names separated by commas.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{isEditing ? 'Save Changes' : 'Add Class'}</Button>
        </div>
      </form>
    </Form>
  )
}
