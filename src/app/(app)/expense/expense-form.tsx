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
import type { Expense } from '@/lib/types'
import { useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'

const formSchema = z.object({
  date: z.string().min(1, 'Date is required.'),
  category: z.string().min(1, 'Category is required.'),
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than zero.'),
})

export function ExpenseForm({
  expense,
  onExpenseAdded,
  onExpenseUpdated,
  onCancel,
}: {
  expense?: Expense | null,
  onExpenseAdded: (expense: Omit<Expense, 'id'>) => void
  onExpenseUpdated: (expense: Expense) => void
  onCancel: () => void
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: expense ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      category: expense?.category || '',
      description: expense?.description || '',
      amount: expense?.amount || 0,
    },
  })

  useEffect(() => {
    if (expense) {
        form.reset({
            ...expense,
            date: format(new Date(expense.date), 'yyyy-MM-dd'),
        })
    } else {
        form.reset({ 
            date: format(new Date(), 'yyyy-MM-dd'),
            category: '',
            description: '',
            amount: 0,
        })
    }
  }, [expense, form])

  const isEditing = !!expense;

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing && expense) {
        onExpenseUpdated({
            id: expense.id,
            ...values,
        })
    } else {
        onExpenseAdded(values)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Office Supplies, Utilities" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Details about the expense" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (₹)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{isEditing ? 'Save Changes' : 'Add Expense'}</Button>
        </div>
      </form>
    </Form>
  )
}
