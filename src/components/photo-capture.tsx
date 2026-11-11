'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, RefreshCcw, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from './ui/alert-dialog'
import { Dialog, DialogContent } from './ui/dialog'
import { Alert, AlertTitle, AlertDescription } from './ui/alert'

interface PhotoCaptureProps {
  onCapture: (imageDataUrl: string) => void
  onClose: () => void
}

export function PhotoCapture({ onCapture, onClose }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(
    null
  )
  const { toast } = useToast()

  useEffect(() => {
    let stream: MediaStream | null = null

    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setHasCameraPermission(true)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
        setHasCameraPermission(false)
      }
    }

    getCameraPermission()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const handleCapture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas) {
      const context = canvas.getContext('2d')
      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setCapturedImage(dataUrl)
      }
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
  }

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage)
      toast({
        title: 'Photo Attached',
        description: 'The captured photo has been attached successfully.',
      })
      onClose()
    }
  }

  if (hasCameraPermission === false) {
    return (
      <AlertDialog open={true} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Camera Access Denied</AlertDialogTitle>
            <AlertDialogDescription>
              To capture a photo, please allow camera access in your browser
              settings and refresh the page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onClose}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  if (hasCameraPermission === null) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <div className="p-6 text-center">
            <p>Requesting camera permission...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center gap-4">
        {capturedImage ? (
          <>
            <Button variant="outline" onClick={handleRetake}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button onClick={handleConfirm}>
              <Check className="mr-2 h-4 w-4" />
              Confirm Photo
            </Button>
          </>
        ) : (
          <Button onClick={handleCapture} size="lg">
            <Camera className="mr-2 h-5 w-5" />
            Capture Photo
          </Button>
        )}
      </div>
      <Button variant="ghost" onClick={onClose} className="w-full">
        Cancel
      </Button>
    </div>
  )
}
