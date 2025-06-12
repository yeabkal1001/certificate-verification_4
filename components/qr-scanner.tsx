"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, Loader2, RefreshCw } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  isLoading?: boolean
}

export function QRScanner({ onScan, isLoading }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")
      setAvailableCameras(videoDevices)

      // Select the back camera by default if available
      const backCamera = videoDevices.find(
        (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("rear"),
      )

      if (backCamera) {
        setSelectedCamera(backCamera.deviceId)
      } else if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId)
      }
    } catch (err) {
      console.error("Error getting cameras:", err)
    }
  }

  useEffect(() => {
    getAvailableCameras()
  }, [])

  const startScanning = async () => {
    try {
      setError("")

      // Request camera permission
      const constraints: MediaStreamConstraints = {
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : { facingMode: "environment" },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      setHasPermission(true)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setIsScanning(true)

      // In a real implementation, we would use a QR code scanning library
      // For now, we'll simulate QR code detection
      scannerRef.current = setTimeout(() => {
        const mockQRData =
          "CERT-2024-" +
          Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0")
        onScan(mockQRData)
        stopScanning()
      }, 3000)
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions in your browser settings.")
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please connect a camera and try again.")
      } else {
        setError(`Camera error: ${err.message || "Unknown error"}`)
      }
      setHasPermission(false)
      console.error("Camera error:", err)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (scannerRef.current) {
      clearTimeout(scannerRef.current)
      scannerRef.current = null
    }

    setIsScanning(false)
  }

  const handleCameraChange = (deviceId: string) => {
    if (isScanning) {
      stopScanning()
    }
    setSelectedCamera(deviceId)
  }

  const handleRetry = () => {
    setError("")
    setHasPermission(null)
    getAvailableCameras()
  }

  return (
    <div className="space-y-4">
      {/* Camera View */}
      <div
        className="relative aspect-square bg-muted rounded-lg overflow-hidden"
        role="region"
        aria-label="QR code scanner"
      >
        {isScanning ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
              aria-hidden="true"
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-brand-pink rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-pink"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-pink"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-pink"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-pink"></div>

                {/* Scanning line animation */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-pink-purple animate-pulse"></div>
              </div>
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-pink mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Verifying certificate...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Camera preview will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={handleRetry} aria-label="Retry camera access">
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Camera Selection */}
      {availableCameras.length > 1 && (
        <div className="flex items-center gap-2">
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedCamera || ""}
            onChange={(e) => handleCameraChange(e.target.value)}
            disabled={isScanning || isLoading}
            aria-label="Select camera"
          >
            {availableCameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isScanning ? (
          <Button
            onClick={startScanning}
            className="flex-1 bg-gradient-pink-purple hover:opacity-90 transition-opacity"
            disabled={isLoading}
            aria-label="Start scanning"
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Scanning
          </Button>
        ) : (
          <Button
            onClick={stopScanning}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
            aria-label="Stop scanning"
          >
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Scanning
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>• Position the QR code within the scanning area</p>
        <p>• Ensure good lighting for best results</p>
        <p>• Hold your device steady while scanning</p>
      </div>
    </div>
  )
}
