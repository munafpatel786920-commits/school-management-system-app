
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
import type { User, Role } from '@/lib/types'
import { useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const formSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['principal', 'teacher', 'accountant']),
})

const editFormSchema = z.object({
  email: z.string().email(),
  role: z.enum(['principal', 'teacher', 'accountant']),
});

export type UserFormData = z.infer<typeof formSchema>

type UserFormProps = {
  user?: User | null,
  onFormSubmit: (data: Partial<UserFormData>) => void,
  onCancel: () => void,
}

export function UserForm({ user, onFormSubmit, onCancel }: UserFormProps) {
  const isEditing = !!user;

  const form = useForm<z.infer<typeof formSchema> | z.infer<typeof editFormSchema>>({
    resolver: zodResolver(isEditing ? editFormSchema : formSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'teacher',
    },
  })

  useEffect(() => {
    if (isEditing && user) {
      form.reset({
        email: user.email,
        role: user.role as 'principal' | 'teacher' | 'accountant',
      })
    } else {
      form.reset({
        email: '',
        password: '',
        role: 'teacher',
      });
    }
  }, [user, isEditing, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="user@example.com" {...field} disabled={isEditing} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isEditing && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value as Role}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{isEditing ? 'Save Changes' : 'Create User'}</Button>
        </div>
      </form>
    </Form>
  )
}
