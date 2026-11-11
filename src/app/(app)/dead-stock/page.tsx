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
import type { DeadStock } from '@/lib/types'
import { useData } from '@/context/data-context'
import { DeadStockForm } from './dead-stock-form'
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
import { Badge } from '@/components/ui/badge'


export default function DeadStockPage() {
  const { deadStock, addDeadStock, updateDeadStock, deleteDeadStock, isLoading } = useData()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DeadStock | null>(null)

  const handleOpenForm = (item: DeadStock | null = null) => {
    setEditingItem(item);
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setEditingItem(null);
    setIsFormOpen(false);
  }

  const handleAddItem = (newItemData: Omit<DeadStock, 'id'>) => {
    addDeadStock(newItemData);
    toast({
        title: 'Item Added',
        description: `The item has been added to dead stock.`,
    })
    handleCloseForm()
  }

  const handleUpdateItem = (updatedItemData: DeadStock) => {
    updateDeadStock(updatedItemData);
     toast({
        title: 'Item Updated',
        description: 'The dead stock item has been updated.',
    })
    handleCloseForm();
  }

  const handleDeleteItem = (itemId: string) => {
    deleteDeadStock(itemId);
    toast({
        title: 'Item Deleted',
        description: 'The item has been removed from dead stock.',
        variant: 'destructive'
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Dead Stock</CardTitle>
            <CardDescription>
              Manage unusable or obsolete inventory.
            </CardDescription>
          </div>
            <Button size="sm" className="gap-1" onClick={() => handleOpenForm()}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Item
              </span>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead className="text-right">Price (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading dead stock...
                  </TableCell>
                </TableRow>
              ) : deadStock.length > 0 ? (
                deadStock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{format(new Date(item.purchaseDate), 'dd-MM-yyyy')}</TableCell>
                    <TableCell className="text-right">{item.price ? `₹${item.price.toLocaleString('en-IN')}` : 'N/A'}</TableCell>
                     <TableCell>
                        <Badge variant={item.status === 'In Stock' ? 'secondary' : 'default'}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(item)}>
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
                                This action cannot be undone. This will permanently delete this item.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No items found in dead stock.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-headline">{editingItem ? 'Edit Item' : 'Add New Item to Dead Stock'}</DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the item details below.' : 'Fill in the details for the new dead stock item.'}
                </DialogDescription>
              </DialogHeader>
              <DeadStockForm
                item={editingItem}
                onItemAdded={handleAddItem}
                onItemUpdated={handleUpdateItem}
                onCancel={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
    </>
  )
}
