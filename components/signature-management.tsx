"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { PenTool, Upload, Download, Trash2, Eye, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Signature {
  id: string
  name: string
  type: "drawn" | "uploaded"
  dataUrl: string
  createdAt: string
  isActive: boolean
}

const mockSignatures: Signature[] = [
  {
    id: "sig_1",
    name: "Director Signature",
    type: "drawn",
    dataUrl: "/placeholder.svg?height=100&width=300",
    createdAt: "2024-03-01T10:00:00Z",
    isActive: true,
  },
  {
    id: "sig_2",
    name: "Academic Coordinator",
    type: "uploaded",
    dataUrl: "/placeholder.svg?height=100&width=300",
    createdAt: "2024-02-15T14:30:00Z",
    isActive: false,
  },
]

export function SignatureManagement() {
  const [signatures, setSignatures] = useState(mockSignatures)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentSignature, setCurrentSignature] = useState("")
  const [signatureName, setSignatureName] = useState("")
  const [signatureTitle, setSignatureTitle] = useState("")
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewSignature, setPreviewSignature] = useState<Signature | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.strokeStyle = "#000000"
      }
    }
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return

    setCurrentSignature(canvas.toDataURL())
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setCurrentSignature("")
  }

  const saveSignature = () => {
    if (!currentSignature || !signatureName) {
      toast({
        title: "Error",
        description: "Please draw a signature and enter a name",
        variant: "destructive",
      })
      return
    }

    const newSignature: Signature = {
      id: `sig_${Date.now()}`,
      name: signatureName,
      type: "drawn",
      dataUrl: currentSignature,
      createdAt: new Date().toISOString(),
      isActive: false,
    }

    setSignatures([...signatures, newSignature])
    setSignatureName("")
    setSignatureTitle("")
    clearCanvas()

    toast({
      title: "Signature Saved",
      description: "Your signature has been saved successfully",
    })
  }

  const handleFileUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!signatureName) {
      toast({
        title: "Error",
        description: "Please enter a name for the signature",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string

      const newSignature: Signature = {
        id: `sig_${Date.now()}`,
        name: signatureName,
        type: "uploaded",
        dataUrl,
        createdAt: new Date().toISOString(),
        isActive: false,
      }

      setSignatures([...signatures, newSignature])
      setSignatureName("")

      toast({
        title: "Signature Uploaded",
        description: "Your signature has been uploaded successfully",
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
    reader.readAsDataURL(file)
  }

  const setActiveSignature = (signatureId: string) => {
    setSignatures(
      signatures.map((sig) => ({
        ...sig,
        isActive: sig.id === signatureId,
      })),
    )

    toast({
      title: "Active Signature Updated",
      description: "This signature will now be used on new certificates",
    })
  }

  const deleteSignature = (signatureId: string) => {
    setSignatures(signatures.filter((sig) => sig.id !== signatureId))
    toast({
      title: "Signature Deleted",
      description: "The signature has been deleted successfully",
      variant: "destructive",
    })
  }

  const previewSignatureOnCertificate = (signature: Signature) => {
    setPreviewSignature(signature)
    setIsPreviewDialogOpen(true)
  }

  const activeSignature = signatures.find((sig) => sig.isActive)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Signature Management</h3>
          <p className="text-sm text-muted-foreground">Manage signatures that appear on certificates</p>
        </div>
        {activeSignature && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Active Signature:</p>
            <p className="font-medium">{activeSignature.name}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Signature */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Signature</CardTitle>
            <CardDescription>Draw or upload a signature for certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="draw" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="draw">Draw Signature</TabsTrigger>
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
              </TabsList>

              <TabsContent value="draw" className="space-y-4">
                <div className="space-y-2">
                  <Label>Signature Name</Label>
                  <Input
                    placeholder="e.g., Director Signature"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input
                    placeholder="e.g., Academic Director"
                    value={signatureTitle}
                    onChange={(e) => setSignatureTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Draw Your Signature</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={150}
                      className="w-full bg-white rounded border touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={endDrawing}
                      onMouseLeave={endDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={endDrawing}
                    />
                    <div className="flex justify-between mt-2">
                      <p className="text-xs text-muted-foreground">Draw your signature above</p>
                      <Button variant="outline" size="sm" onClick={clearCanvas}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={saveSignature} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Signature
                </Button>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label>Signature Name</Label>
                  <Input
                    placeholder="e.g., Uploaded Signature"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Signature Image</Label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={handleFileUploadClick}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mb-4">PNG, JPG up to 5MB</p>
                    <Button variant="outline" className="cursor-pointer">
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (!signatureName) {
                      toast({
                        title: "Error",
                        description: "Please enter a signature name first",
                        variant: "destructive",
                      })
                      return
                    }
                    handleFileUploadClick()
                  }}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Signature
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Existing Signatures */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Signatures</CardTitle>
            <CardDescription>Manage your existing signatures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {signatures.length > 0 ? (
                signatures.map((signature) => (
                  <motion.div
                    key={signature.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{signature.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {signature.type === "drawn" ? "Hand-drawn" : "Uploaded"} • Created{" "}
                          {new Date(signature.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {signature.isActive && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded p-2 h-16 flex items-center justify-center">
                      <img
                        src={signature.dataUrl || "/placeholder.svg"}
                        alt={signature.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => previewSignatureOnCertificate(signature)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      {!signature.isActive && (
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => setActiveSignature(signature.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => deleteSignature(signature.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <PenTool className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-muted-foreground">No signatures saved yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview with Signature</DialogTitle>
            <DialogDescription>Preview how the signature will appear on certificates</DialogDescription>
          </DialogHeader>

          {previewSignature && (
            <div className="space-y-4">
              <div className="aspect-[3/2] border rounded-lg p-8 bg-white flex flex-col justify-center items-center text-center">
                <div className="space-y-4 w-full max-w-md">
                  <div className="text-sm opacity-75">Certificate of Achievement</div>
                  <h2 className="text-2xl font-bold text-pink-600">John Doe</h2>
                  <div className="text-sm">has successfully completed</div>
                  <h3 className="text-xl font-semibold">Professional Makeup Artistry</h3>

                  <div className="flex justify-between items-end mt-8">
                    <div className="text-left">
                      <div className="text-xs">Date</div>
                      <div className="text-sm">March 15, 2024</div>
                    </div>

                    <div className="text-center">
                      <div className="h-16 w-40 mb-1 flex items-center justify-center">
                        <img
                          src={previewSignature.dataUrl || "/placeholder.svg"}
                          alt="Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="w-40 border-t border-gray-400 pt-1">
                        <div className="text-xs">Authorized Signature</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs">Certificate ID</div>
                      <div className="text-sm">CERT-2024-0001</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Preview
                </Button>
                <Button onClick={() => setActiveSignature(previewSignature.id)}>Set as Active Signature</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
