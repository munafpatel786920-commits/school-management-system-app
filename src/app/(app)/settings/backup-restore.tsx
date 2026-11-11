'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Upload, Loader2, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useFirestore } from '@/firebase'
import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore'
import { useData } from '@/context/data-context'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const firestore = useFirestore()
  const { userData } = useData()

  const collections = [
    'students', 'teachers', 'classes', 'attendance', 
    'teacher_attendance', 'expenses', 'dead_stock', 
    'fees', 'exam_schedules'
  ]

  const handleExport = async () => {
    if (!firestore || !userData?.schoolId) {
        toast({ variant: 'destructive', title: 'Error', description: 'School context not found.' })
        return
    }
    setIsExporting(true)
    toast({ title: 'Exporting Data', description: 'Gathering all school records...' })

    try {
      const backupData: any = {
        schoolId: userData.schoolId,
        exportDate: new Date().toISOString(),
        version: '4.0',
        data: {}
      }

      for (const colPath of collections) {
        const q = query(collection(firestore, colPath), where('schoolId', '==', userData.schoolId))
        const snapshot = await getDocs(q)
        backupData.data[colPath] = snapshot.docs.map(d => ({ ...d.data(), id: d.id }))
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `VidyaVerse_Backup_${userData.schoolId}_${format(new Date(), 'yyyyMMdd_HHmm')}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ 
        title: 'Backup Successful', 
        description: 'Your school data has been saved to your computer.',
        variant: 'default'
      })
    } catch (error: any) {
      console.error('Export error:', error)
      toast({ variant: 'destructive', title: 'Export Failed', description: error.message })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !firestore || !userData?.schoolId) return

    setIsImporting(true)
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string)

        if (!backupData.data || !backupData.version) {
          throw new Error('Invalid backup file format.')
        }

        toast({ title: 'Restoring Data', description: 'Applying backup to your school...' })

        // 1. Wipe current data for this school
        for (const colPath of collections) {
          const q = query(collection(firestore, colPath), where('schoolId', '==', userData.schoolId))
          const snapshot = await getDocs(q)
          let batch = writeBatch(firestore)
          let count = 0
          for (const docSnap of snapshot.docs) {
            batch.delete(docSnap.ref)
            count++
            if (count >= 400) {
              await batch.commit()
              batch = writeBatch(firestore)
              count = 0
            }
          }
          if (count > 0) await batch.commit()
        }

        // 2. Insert new data
        for (const colPath of collections) {
          const items = backupData.data[colPath] || []
          let batch = writeBatch(firestore)
          let count = 0
          for (const item of items) {
            const { id, ...data } = item
            const restoredData = { ...data, schoolId: userData.schoolId }
            const docRef = doc(firestore, colPath, id)
            batch.set(docRef, restoredData)
            count++
            if (count >= 400) {
              await batch.commit()
              batch = writeBatch(firestore)
              count = 0
            }
          }
          if (count > 0) await batch.commit()
        }

        toast({ 
          title: 'Restore Complete!', 
          description: 'Your school data has been successfully synchronized and updated.',
          variant: 'default'
        })
        
        // Give the user a moment to see the success message
        setTimeout(() => window.location.reload(), 2000)
      } catch (error: any) {
        console.error('Import error:', error)
        toast({ variant: 'destructive', title: 'Restore Failed', description: error.message })
      } finally {
        setIsImporting(false)
        if (event.target) event.target.value = ''
      }
    }

    reader.readAsText(file)
  }

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2 text-blue-700">
          <FileJson className="h-5 w-5" />
          Data Backup & Local Restore
        </CardTitle>
        <CardDescription>
          Save your school's records to your PC or restore from a previous backup file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl bg-blue-50/30 flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-sm text-blue-800">
              <Download className="h-4 w-4" />
              Download Backup
            </div>
            <p className="text-[11px] text-muted-foreground">Creates a JSON snapshot of all student and operational records.</p>
            <Button onClick={handleExport} disabled={isExporting} variant="outline" className="w-full mt-auto border-blue-200 hover:bg-blue-100">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Export to PC (.json)'}
            </Button>
          </div>

          <div className="p-4 border rounded-xl bg-emerald-50/30 flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <Upload className="h-4 w-4" />
              Restore from File
            </div>
            <p className="text-[11px] text-muted-foreground">Overwrites current cloud data with records from your backup file.</p>
            <div className="relative mt-auto">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Button disabled={isImporting} variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload & Restore'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 leading-tight">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> रीस्टोर करने से वर्तमान डेटा पूरी तरह हट जाएगा। हमेशा डेटा रीस्टोर करने से पहले एक बैकअप ज़रूर लें। बैकअप फाइल का डेटा केवल आपके स्कूल कोड के साथ ही काम करेगा।
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
