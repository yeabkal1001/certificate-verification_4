"use client"

import type React from "react"

import { CertificateGenerator } from "@/components/certificate-generator"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Eye, FileImage, FileSignature, Moon, Palette, QrCode, Sun, Type, User, Check } from "lucide-react"
import * as QRCodeLib from "qrcode"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { motion } from "framer-motion"

const fontOptions = [
  { label: "Sans Serif", value: "font-sans", fontFamily: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "font-serif", fontFamily: "ui-serif, Georgia, serif" },
  { label: "Monospace", value: "font-mono", fontFamily: "ui-monospace, SFMono-Regular, monospace" },
]

const certificateTemplates = [
  {
    id: "elegant",
    name: "Elegant",
    backgroundColor: "#f8fafc",
    textColor: "#4b5563",
  },
  {
    id: "modern",
    name: "Modern",
    backgroundColor: "#e5e7eb",
    textColor: "#374151",
  },
  {
    id: "vibrant",
    name: "Vibrant",
    backgroundColor: "#fce7f3",
    textColor: "#701a75",
  },
]

export default function CertificateGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Certificate <span className="text-pink-500">Generator</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Design and generate professional certificates with custom templates, text, and verification QR codes
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <CertificateGenerator />
        </div>
      </div>
    </div>
  )
}

export function CertificateGeneratorComponent() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const certificateRef = useRef<HTMLDivElement>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [activeTab, setActiveTab] = useState("content")
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Certificate data
  const [certificateData, setCertificateData] = useState({
    recipientName: "John Doe",
    courseName: "Professional Makeup Artistry",
    issueDate: new Date().toISOString().split("T")[0],
    certificateId: `CERT-${Math.floor(100000 + Math.random() * 900000)}`,
    issuer: "IMS Certify",
    additionalText: "This certificate is awarded for successfully completing the course requirements with distinction.",
  })

  // Design options
  const [designOptions, setDesignOptions] = useState({
    template: "elegant",
    nameFont: "font-serif",
    nameFontSize: 36,
    courseFont: "font-sans",
    courseFontSize: 24,
    dateFont: "font-sans",
    dateFontSize: 16,
    additionalTextFont: "font-sans",
    additionalTextFontSize: 14,
    includeQR: true,
    includeSignature: true,
    signaturePosition: "right",
    qrPosition: "right",
  })

  // Signature state
  const [hasSignature, setHasSignature] = useState(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState("")

  useEffect(() => {
    setMounted(true)
    generateQR()
  }, [])

  useEffect(() => {
    if (mounted) {
      generateQR()
    }
  }, [certificateData.certificateId, mounted])

  const generateQR = async () => {
    try {
      const verificationUrl = `${window.location.origin}/?verify=${certificateData.certificateId}`

      // Generate QR code as data URL
      const qrDataUrl = await QRCodeLib.toDataURL(verificationUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      })

      setQrDataUrl(qrDataUrl)
    } catch (error) {
      console.error("Error generating QR code:", error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setCertificateData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDesignChange = (field: string, value: any) => {
    setDesignOptions((prev) => ({ ...prev, [field]: value }))
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Get font family from font option
  const getFontFamily = (fontValue: string) => {
    const fontOption = fontOptions.find((f) => f.value === fontValue)
    return fontOption?.fontFamily || "ui-sans-serif, system-ui, sans-serif"
  }

  // Signature canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()

    // Handle both mouse and touch events
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Handle both mouse and touch events
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
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    setSignatureDataUrl(canvas.toDataURL())
    setHasSignature(true)
  }

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    setSignatureDataUrl("")
  }

  const initializeSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#000000"
  }

  useEffect(() => {
    if (signatureCanvasRef.current) {
      initializeSignatureCanvas()
    }
  }, [signatureCanvasRef])

  // Get selected template
  const selectedTemplate = certificateTemplates.find((t) => t.id === designOptions.template) || certificateTemplates[0]

  // Generate PDF
  const generatePDF = async () => {
    if (!certificateRef.current) return

    setGeneratingPDF(true)

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      })

      const imgData = canvas.toDataURL("image/png")

      // A4 dimensions in mm: 210 x 297
      // Landscape orientation: 297 x 210
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      // Calculate aspect ratio to fit the image properly
      const imgWidth = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`${certificateData.recipientName.replace(/\s+/g, "_")}_Certificate.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-black text-black dark:text-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="relative h-8 w-8">
                  <Image src="/images/logo.png" alt="IMS Logo" fill className="object-contain" priority />
                </div>
                <h1 className="text-2xl font-bold">
                  Certificate <span className="text-pink-500">Generator</span>
                </h1>
              </div>
            </div>
            {mounted && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">
            Create Your <span className="text-pink-500">Custom</span> Certificate
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Design and generate professional certificates with custom templates, text, and verification QR codes
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="design" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Design
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <Card className="border-2 border-gray-200 dark:border-gray-800 dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Certificate Information
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Enter the details for your certificate
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientName">Recipient Name *</Label>
                      <Input
                        id="recipientName"
                        value={certificateData.recipientName}
                        onChange={(e) => handleInputChange("recipientName", e.target.value)}
                        className="border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="courseName">Course/Achievement *</Label>
                      <Input
                        id="courseName"
                        value={certificateData.courseName}
                        onChange={(e) => handleInputChange("courseName", e.target.value)}
                        className="border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issueDate">Issue Date *</Label>
                      <Input
                        id="issueDate"
                        type="date"
                        value={certificateData.issueDate}
                        onChange={(e) => handleInputChange("issueDate", e.target.value)}
                        className="border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certificateId">Certificate ID *</Label>
                      <Input
                        id="certificateId"
                        value={certificateData.certificateId}
                        onChange={(e) => handleInputChange("certificateId", e.target.value)}
                        className="border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="issuer">Issuer *</Label>
                      <Input
                        id="issuer"
                        value={certificateData.issuer}
                        onChange={(e) => handleInputChange("issuer", e.target.value)}
                        className="border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additionalText">Additional Text</Label>
                      <Textarea
                        id="additionalText"
                        value={certificateData.additionalText}
                        onChange={(e) => handleInputChange("additionalText", e.target.value)}
                        rows={3}
                        className="border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-200 dark:border-gray-800 dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSignature className="h-5 w-5" />
                      Signature
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">
                      Add your signature to the certificate
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
                      <canvas
                        ref={signatureCanvasRef}
                        width={400}
                        height={150}
                        className="w-full bg-white dark:bg-gray-800 rounded-md touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={endDrawing}
                        onMouseLeave={endDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={endDrawing}
                      />
                      <div className="flex justify-end mt-2">
                        <Button variant="outline" size="sm" onClick={clearSignature} className="text-xs">
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="includeSignature"
                        checked={designOptions.includeSignature}
                        onCheckedChange={(checked) => handleDesignChange("includeSignature", checked)}
                      />
                      <Label htmlFor="includeSignature">Include signature on certificate</Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="design" className="space-y-4">
                <Card className="border-2 border-gray-200 dark:border-gray-800 dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileImage className="h-5 w-5" />
                      Template
                    </CardTitle>
                    <CardDescription className="dark:text-gray-400">Choose a certificate template</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {certificateTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            designOptions.template === template.id
                              ? "border-pink-500 shadow-md"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                          onClick={() => handleDesignChange("template", template.id)}
                        >
                          <div
                            className="w-full h-24 flex items-center justify-center text-sm font-medium"
                            style={{ backgroundColor: template.backgroundColor, color: template.textColor }}
                          >
                            {template.name} Template
                          </div>
                          {designOptions.template === template.id && (
                            <div className="absolute top-2 right-2 bg-pink-500 rounded-full p-1">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <Label>Recipient Name</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <Select
                            value={designOptions.nameFont}
                            onValueChange={(value) => handleDesignChange("nameFont", value)}
                          >
                            <SelectTrigger className="border-gray-300 dark:border-gray-700 dark:bg-gray-800">
                              <SelectValue placeholder="Font" />
                            </SelectTrigger>
                            <SelectContent>
                              {fontOptions.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                  {font.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Size</span>
                              <span>{designOptions.nameFontSize}px</span>
                            </div>
                            <Slider
                              value={[designOptions.nameFontSize]}
                              min={16}
                              max={72}
                              step={1}
                              onValueChange={(value) => handleDesignChange("nameFontSize", value[0])}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Course/Achievement</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <Select
                            value={designOptions.courseFont}
                            onValueChange={(value) => handleDesignChange("courseFont", value)}
                          >
                            <SelectTrigger className="border-gray-300 dark:border-gray-700 dark:bg-gray-800">
                              <SelectValue placeholder="Font" />
                            </SelectTrigger>
                            <SelectContent>
                              {fontOptions.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                  {font.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Size</span>
                              <span>{designOptions.courseFontSize}px</span>
                            </div>
                            <Slider
                              value={[designOptions.courseFontSize]}
                              min={12}
                              max={48}
                              step={1}
                              onValueChange={(value) => handleDesignChange("courseFontSize", value[0])}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="includeQR"
                          checked={designOptions.includeQR}
                          onCheckedChange={(checked) => handleDesignChange("includeQR", checked)}
                        />
                        <Label htmlFor="includeQR">Include QR code for verification</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Label htmlFor="qrPosition" className="flex-shrink-0">
                          QR Position:
                        </Label>
                        <Select
                          value={designOptions.qrPosition}
                          onValueChange={(value) => handleDesignChange("qrPosition", value)}
                          disabled={!designOptions.includeQR}
                        >
                          <SelectTrigger className="border-gray-300 dark:border-gray-700 dark:bg-gray-800">
                            <SelectValue placeholder="Position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex flex-col space-y-4">
              <Button
                onClick={generatePDF}
                className="bg-pink-500 hover:bg-pink-600 text-white"
                disabled={generatingPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                {generatingPDF ? "Generating PDF..." : "Download Certificate"}
              </Button>

              <Button
                variant="outline"
                className="border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white"
                asChild
              >
                <Link href="/qr-generator">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code Only
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-gray-200 dark:border-gray-800 dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Certificate Preview
                </CardTitle>
                <CardDescription className="dark:text-gray-400">Preview how your certificate will look</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-white rounded-lg overflow-hidden shadow-lg">
                  <div
                    ref={certificateRef}
                    className="relative w-full aspect-[1.414/1] p-8 flex flex-col items-center justify-center text-center"
                    style={{ backgroundColor: selectedTemplate.backgroundColor }}
                  >
                    {/* Certificate Content */}
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      {/* Header */}
                      <div className="mb-6">
                        <div className="relative h-16 w-16 mx-auto mb-2">
                          <Image src="/images/logo.png" alt="IMS Logo" fill className="object-contain" />
                        </div>
                        <h2
                          className="text-xl font-bold"
                          style={{
                            color: selectedTemplate.textColor,
                            fontFamily: getFontFamily(designOptions.nameFont),
                          }}
                        >
                          {certificateData.issuer}
                        </h2>
                        <div
                          className="mt-1 text-sm"
                          style={{
                            color: selectedTemplate.textColor,
                            fontFamily: getFontFamily(designOptions.courseFont),
                          }}
                        >
                          Certificate of Achievement
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="mb-8 flex-1 flex flex-col justify-center">
                        <div
                          className="text-sm mb-2"
                          style={{
                            color: selectedTemplate.textColor,
                            fontFamily: getFontFamily(designOptions.courseFont),
                          }}
                        >
                          This certifies that
                        </div>
                        <div
                          className="mb-4 font-bold"
                          style={{
                            fontSize: `${designOptions.nameFontSize}px`,
                            color: selectedTemplate.textColor,
                            lineHeight: 1.2,
                            fontFamily: getFontFamily(designOptions.nameFont),
                          }}
                        >
                          {certificateData.recipientName}
                        </div>

                        <div
                          className="text-sm mb-2"
                          style={{
                            color: selectedTemplate.textColor,
                            fontFamily: getFontFamily(designOptions.courseFont),
                          }}
                        >
                          has successfully completed
                        </div>
                        <div
                          className="mb-4 font-semibold"
                          style={{
                            fontSize: `${designOptions.courseFontSize}px`,
                            color: selectedTemplate.textColor,
                            lineHeight: 1.2,
                            fontFamily: getFontFamily(designOptions.courseFont),
                          }}
                        >
                          {certificateData.courseName}
                        </div>

                        <div
                          className="text-sm mt-4 max-w-md mx-auto"
                          style={{
                            color: selectedTemplate.textColor,
                            fontFamily: getFontFamily(designOptions.additionalTextFont),
                            fontSize: `${designOptions.additionalTextFontSize}px`,
                          }}
                        >
                          {certificateData.additionalText}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="w-full flex justify-between items-end">
                        {/* Date */}
                        <div className="text-left">
                          <div
                            className="text-sm font-medium"
                            style={{
                              color: selectedTemplate.textColor,
                              fontFamily: getFontFamily(designOptions.dateFont),
                            }}
                          >
                            Date
                          </div>
                          <div
                            className="text-sm"
                            style={{
                              color: selectedTemplate.textColor,
                              fontFamily: getFontFamily(designOptions.dateFont),
                            }}
                          >
                            {new Date(certificateData.issueDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>

                        {/* Signature */}
                        {designOptions.includeSignature && hasSignature && (
                          <div className="text-center">
                            <div className="h-16 w-40 mb-1">
                              <img
                                src={signatureDataUrl || "/placeholder.svg"}
                                alt="Signature"
                                className="h-full object-contain"
                              />
                            </div>
                            <div className="w-40 border-t border-gray-400 pt-1">
                              <div
                                className="text-sm"
                                style={{
                                  color: selectedTemplate.textColor,
                                  fontFamily: getFontFamily(designOptions.dateFont),
                                }}
                              >
                                Authorized Signature
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Certificate ID and QR */}
                        <div className="text-right flex flex-col items-end">
                          {designOptions.includeQR && qrDataUrl && (
                            <div className="mb-2">
                              <img
                                src={qrDataUrl || "/placeholder.svg"}
                                alt="Verification QR Code"
                                className="h-16 w-16"
                              />
                            </div>
                          )}
                          <div
                            className="text-xs"
                            style={{
                              color: selectedTemplate.textColor,
                              fontFamily: getFontFamily(designOptions.dateFont),
                            }}
                          >
                            Certificate ID: {certificateData.certificateId}
                          </div>
                          <div
                            className="text-xs"
                            style={{
                              color: selectedTemplate.textColor,
                              fontFamily: getFontFamily(designOptions.dateFont),
                            }}
                          >
                            Verify at: {typeof window !== "undefined" ? window.location.origin : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 py-8 border-t border-gray-200 dark:border-gray-800"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="relative h-5 w-5">
                <Image src="/images/logo.png" alt="IMS Logo" fill className="object-contain" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} IMS Certify. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-pink-500 dark:text-gray-400 dark:hover:text-pink-400">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 hover:text-pink-500 dark:text-gray-400 dark:hover:text-pink-400">
                Terms of Service
              </a>
              <a href="#" className="text-gray-600 hover:text-pink-500 dark:text-gray-400 dark:hover:text-pink-400">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
