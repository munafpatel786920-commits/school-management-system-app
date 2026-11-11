'use client'

import React, { useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface DocumentPreviewProps {
  htmlContent: string
}

export function DocumentPreview({ htmlContent }: DocumentPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe) {
        iframe.srcdoc = htmlContent;
    }
  }, [htmlContent])

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=800,width=600');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      // Use a timeout to ensure content is loaded before printing
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Document Preview</CardTitle>
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print Document
        </Button>
      </CardHeader>
      <CardContent>
        <div className="w-full aspect-[1/1.414] border rounded-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            title="Generated Document Preview"
            className="w-full h-full"
          />
        </div>
      </CardContent>
    </Card>
  )
}
