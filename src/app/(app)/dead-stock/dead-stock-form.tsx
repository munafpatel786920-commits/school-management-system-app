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
import type { DeadStock } from '@/lib/types'
import { useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'

const formSchema = z.object({
  itemName: z.string().min(1, 'Item name is required.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  price: z.coerce.number().min(0.01, 'Price must be greater than zero.'),
  purchaseDate: z.string().min(1, 'Purchase date is required.'),
  description: z.string().optional(),
  status: z.enum(['In Stock', 'Disposed', 'Sold', 'Written Off']),
})

export function DeadStockForm({
  item,
  onItemAdded,
  onItemUpdated,
  onCancel,
}: {
  item?: DeadStock | null,
  onItemAdded: (item: Omit<DeadStock, 'id'>) => void
  onItemUpdated: (item: DeadStock) => void
  onCancel: () => void
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: item?.itemName || '',
      quantity: item?.quantity || 1,
      price: item?.price || 0,
      purchaseDate: item ? format(new Date(item.purchaseDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      description: item?.description || '',
      status: item?.status || 'In Stock',
    },
  })

  useEffect(() => {
    if (item) {
        form.reset({
            ...item,
            price: item.price || 0,
            purchaseDate: format(new Date(item.purchaseDate), 'yyyy-MM-dd'),
        })
    } else {
        form.reset({
            itemName: '',
            quantity: 1,
            price: 0,
            purchaseDate: format(new Date(), 'yyyy-MM-dd'),
            description: '',
            status: 'In Stock',
        })
    }
  }, [item, form])

  const isEditing = !!item;

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (isEditing && item) {
        onItemUpdated({
            id: item.id,
            ...values,
        })
    } else {
        onItemAdded(values)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="itemName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Old Computers, Broken Chairs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Reason for being dead stock, condition, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="In Stock">In Stock</SelectItem>
                  <SelectItem value="Disposed">Disposed</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Written Off">Written Off</SelectItem>
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
          <Button type="submit">{isEditing ? 'Save Changes' : 'Add Item'}</Button>
        </div>
      </form>
    </Form>
  )
}
