'use client'

import { useState } from 'react'
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
  DialogDescription,
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
import { PlusCircle, Edit, Trash } from 'lucide-react'
import type { Expense } from '@/lib/types'
import { useData } from '@/context/data-context'
import { ExpenseForm } from './expense-form'
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
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'


export default function ExpensePage() {
  const { expenses, addExpense, updateExpense, deleteExpense, isLoading } = useData()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const handleOpenForm = (expense: Expense | null = null) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setEditingExpense(null);
    setIsFormOpen(false);
  }

  const handleAddExpense = (newExpenseData: Omit<Expense, 'id'>) => {
    addExpense(newExpenseData);
    toast({
        title: 'Expense Added',
        description: `The expense has been recorded.`,
    })
    handleCloseForm()
  }

  const handleUpdateExpense = (updatedExpenseData: Expense) => {
    updateExpense(updatedExpenseData);
     toast({
        title: 'Expense Updated',
        description: 'The expense record has been updated.',
    })
    handleCloseForm();
  }

  const handleDeleteExpense = (expenseId: string) => {
    deleteExpense(expenseId);
    toast({
        title: 'Expense Deleted',
        description: 'The expense record has been removed.',
        variant: 'destructive'
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Expenses</CardTitle>
            <CardDescription>
              Manage all school-related expenses.
            </CardDescription>
          </div>
            <Button size="sm" className="gap-1" onClick={() => handleOpenForm()}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Expense
              </span>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading expenses...
                  </TableCell>
                </TableRow>
              ) : expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{format(new Date(expense.date), 'dd-MM-yyyy')}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right">{expense.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(expense)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8">
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this expense record.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No expenses found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-headline">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                <DialogDescription>
                  {editingExpense ? 'Update the expense details below.' : 'Fill in the details below to add a new expense.'}
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm
                expense={editingExpense}
                onExpenseAdded={handleAddExpense}
                onExpenseUpdated={handleUpdateExpense}
                onCancel={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
    </>
  )
}
