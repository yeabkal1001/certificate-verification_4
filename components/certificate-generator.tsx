"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Download, FileText, Upload, Eye, Settings, Palette, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { templatesApi, signaturesApi } from "@/lib/api/templates"
import type { CertificateTemplate, Signature, BulkCertificateData } from "@/types/template"
import type { Certificate } from "@/types/certificate"
import { generateCertificateId } from "@/lib/utils"
import QRCode from "qrcode.react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface CertificateGeneratorProps {
  onCertificateCreated?: (certificate: Certificate) => void
  refreshKey?: number
}

export function CertificateGenerator({ onCertificateCreated, refreshKey }: CertificateGeneratorProps) {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedSignature, setSelectedSignature] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [previewData, setPreviewData] = useState({
    recipientName: "Almaz Tadesse",
    courseName: "Professional Makeup Artistry",
    grade: "Distinction",
    issueDate: new Date().toISOString().split("T")[0],
    certificateId: generateCertificateId(),
    institution: "IMS Beauty Academy",
  })
  const [bulkData, setBulkData] = useState<BulkCertificateData[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)

  const certificateRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTemplatesAndSignatures()
  }, [refreshKey])

  const loadTemplatesAndSignatures = async () => {
    try {
      const [templatesData, signaturesData] = await Promise.all([templatesApi.getAll(), signaturesApi.getAll()])
      setTemplates(templatesData)
      setSignatures(signaturesData)

      if (templatesData.length > 0 && !selectedTemplate) {
        setSelectedTemplate(templatesData[0].id)
      }

      const activeSignature = signaturesData.find((s) => s.isActive)
      if (activeSignature && !selectedSignature) {
        setSelectedSignature(activeSignature.id)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load templates and signatures",
        variant: "destructive",
      })
    }
  }

  const handlePreviewDataChange = (field: string, value: string) => {
    setPreviewData((prev) => ({ ...prev, [field]: value }))
  }

  const generateQRCode = (certificateId: string) => {
    const verificationUrl = `${window.location.origin}/verify?id=${certificateId}`
    return verificationUrl
  }

  const downloadCertificate = async (format: "pdf" | "png") => {
    if (!certificateRef.current) return

    setIsLoading(true)
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      if (format === "png") {
        const link = document.createElement("a")
        link.download = `${previewData.recipientName.replace(/\s+/g, "_")}_Certificate.png`
        link.href = canvas.toDataURL()
        link.click()
      } else {
        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        })

        const imgWidth = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
        pdf.save(`${previewData.recipientName.replace(/\s+/g, "_")}_Certificate.pdf`)
      }

      toast({
        title: "Download Complete",
        description: `Certificate downloaded as ${format.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate certificate file",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())
      const headers = lines[0].split(",").map((h) => h.trim())

      const data: BulkCertificateData[] = lines
        .slice(1)
        .map((line) => {
          const values = line.split(",").map((v) => v.trim())
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = values[index] || ""
          })
          return {
            recipientName: obj.recipientName || obj["Recipient Name"] || "",
            recipientEmail: obj.recipientEmail || obj["Email"] || "",
            courseName: obj.courseName || obj["Course Name"] || "",
            grade: obj.grade || obj["Grade"] || "Pass",
            issueDate: obj.issueDate || obj["Issue Date"] || new Date().toISOString().split("T")[0],
          }
        })
        .filter((item) => item.recipientName)

      setBulkData(data)
      toast({
        title: "CSV Parsed",
        description: `Found ${data.length} valid records`,
      })
    }

    reader.readAsText(file)
  }

  const generateBulkCertificates = async () => {
    if (!selectedTemplate || bulkData.length === 0) {
      toast({
        title: "Error",
        description: "Please select a template and upload CSV data",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const certificates: Certificate[] = []

      for (const data of bulkData) {
        const certificate: Certificate = {
          id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          certificateId: generateCertificateId(),
          recipientName: data.recipientName,
          recipientEmail: data.recipientEmail,
          courseName: data.courseName,
          institution: previewData.institution,
          issueDate: data.issueDate || new Date().toISOString().split("T")[0],
          grade: data.grade,
          status: "active",
          templateId: selectedTemplate,
          createdBy: "admin", // Would come from auth context
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        certificates.push(certificate)
      }

      // In real implementation, would call API to save certificates
      toast({
        title: "Bulk Generation Complete",
        description: `Generated ${certificates.length} certificates`,
      })

      // Notify parent component
      certificates.forEach((cert) => onCertificateCreated?.(cert))

      // Reset form
      setBulkData([])
      setCsvFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate bulk certificates",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)
  const selectedSignatureData = signatures.find((s) => s.id === selectedSignature)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Certificate</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
          <TabsTrigger value="templates">Template Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Certificate Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Certificate Details
                </CardTitle>
                <CardDescription>Configure the certificate information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Signature</Label>
                  <Select value={selectedSignature} onValueChange={setSelectedSignature}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select signature" />
                    </SelectTrigger>
                    <SelectContent>
                      {signatures.map((signature) => (
                        <SelectItem key={signature.id} value={signature.id}>
                          {signature.name} - {signature.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Recipient Name</Label>
                    <Input
                      value={previewData.recipientName}
                      onChange={(e) => handlePreviewDataChange("recipientName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Course Name</Label>
                    <Input
                      value={previewData.courseName}
                      onChange={(e) => handlePreviewDataChange("courseName", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    <Select
                      value={previewData.grade}
                      onValueChange={(value) => handlePreviewDataChange("grade", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Distinction">Distinction</SelectItem>
                        <SelectItem value="Merit">Merit</SelectItem>
                        <SelectItem value="Pass">Pass</SelectItem>
                        <SelectItem value="Excellence">Excellence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input
                      type="date"
                      value={previewData.issueDate}
                      onChange={(e) => handlePreviewDataChange("issueDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input
                    value={previewData.institution}
                    onChange={(e) => handlePreviewDataChange("institution", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Certificate ID</Label>
                  <div className="flex gap-2">
                    <Input
                      value={previewData.certificateId}
                      onChange={(e) => handlePreviewDataChange("certificateId", e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewDataChange("certificateId", generateCertificateId())}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => downloadCertificate("pdf")} disabled={isLoading} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadCertificate("png")}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>Real-time certificate preview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white">
                  <div
                    ref={certificateRef}
                    className="relative w-full aspect-[4/3] bg-white"
                    style={{
                      backgroundImage: selectedTemplateData ? `url(${selectedTemplateData.backgroundImage})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {selectedTemplateData && (
                      <>
                        {/* Recipient Name */}
                        <div
                          className="absolute text-black font-bold"
                          style={{
                            left: `${selectedTemplateData.layout.recipientName.x}%`,
                            top: `${selectedTemplateData.layout.recipientName.y}%`,
                            width: `${selectedTemplateData.layout.recipientName.width}%`,
                            fontSize: `${selectedTemplateData.styling.recipientName.fontSize * 0.5}px`,
                            color: selectedTemplateData.styling.recipientName.color,
                            textAlign: selectedTemplateData.styling.recipientName.textAlign,
                            fontWeight: selectedTemplateData.styling.recipientName.fontWeight,
                          }}
                        >
                          {previewData.recipientName}
                        </div>

                        {/* Course Name */}
                        <div
                          className="absolute"
                          style={{
                            left: `${selectedTemplateData.layout.courseName.x}%`,
                            top: `${selectedTemplateData.layout.courseName.y}%`,
                            width: `${selectedTemplateData.layout.courseName.width}%`,
                            fontSize: `${selectedTemplateData.styling.courseName.fontSize * 0.5}px`,
                            color: selectedTemplateData.styling.courseName.color,
                            textAlign: selectedTemplateData.styling.courseName.textAlign,
                            fontWeight: selectedTemplateData.styling.courseName.fontWeight,
                          }}
                        >
                          {previewData.courseName}
                        </div>

                        {/* Issue Date */}
                        <div
                          className="absolute"
                          style={{
                            left: `${selectedTemplateData.layout.issueDate.x}%`,
                            top: `${selectedTemplateData.layout.issueDate.y}%`,
                            width: `${selectedTemplateData.layout.issueDate.width}%`,
                            fontSize: `${selectedTemplateData.styling.issueDate.fontSize * 0.5}px`,
                            color: selectedTemplateData.styling.issueDate.color,
                            textAlign: selectedTemplateData.styling.issueDate.textAlign,
                          }}
                        >
                          {new Date(previewData.issueDate).toLocaleDateString()}
                        </div>

                        {/* Certificate ID */}
                        <div
                          className="absolute"
                          style={{
                            left: `${selectedTemplateData.layout.certificateId.x}%`,
                            top: `${selectedTemplateData.layout.certificateId.y}%`,
                            width: `${selectedTemplateData.layout.certificateId.width}%`,
                            fontSize: `${selectedTemplateData.styling.certificateId.fontSize * 0.5}px`,
                            color: selectedTemplateData.styling.certificateId.color,
                            textAlign: selectedTemplateData.styling.certificateId.textAlign,
                          }}
                        >
                          {previewData.certificateId}
                        </div>

                        {/* Institution */}
                        <div
                          className="absolute"
                          style={{
                            left: `${selectedTemplateData.layout.institution.x}%`,
                            top: `${selectedTemplateData.layout.institution.y}%`,
                            width: `${selectedTemplateData.layout.institution.width}%`,
                            fontSize: `${selectedTemplateData.styling.institution.fontSize * 0.5}px`,
                            color: selectedTemplateData.styling.institution.color,
                            textAlign: selectedTemplateData.styling.institution.textAlign,
                          }}
                        >
                          {previewData.institution}
                        </div>

                        {/* Signature */}
                        {selectedSignatureData && (
                          <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `${selectedTemplateData.layout.signature.x}%`,
                              top: `${selectedTemplateData.layout.signature.y}%`,
                              width: `${selectedTemplateData.layout.signature.width}%`,
                            }}
                          >
                            <img
                              src={selectedSignatureData.imageUrl || "/placeholder.svg"}
                              alt="Signature"
                              className="max-w-full h-8 object-contain"
                            />
                            <div className="text-center mt-1">
                              <div
                                style={{
                                  fontSize: `${selectedTemplateData.styling.signatureName.fontSize * 0.4}px`,
                                  color: selectedTemplateData.styling.signatureName.color,
                                  fontWeight: selectedTemplateData.styling.signatureName.fontWeight,
                                }}
                              >
                                {selectedSignatureData.name}
                              </div>
                              <div
                                style={{
                                  fontSize: `${selectedTemplateData.styling.signatureTitle.fontSize * 0.4}px`,
                                  color: selectedTemplateData.styling.signatureTitle.color,
                                }}
                              >
                                {selectedSignatureData.title}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* QR Code */}
                        <div
                          className="absolute"
                          style={{
                            left: `${selectedTemplateData.layout.qrCode.x}%`,
                            top: `${selectedTemplateData.layout.qrCode.y}%`,
                            width: `${selectedTemplateData.layout.qrCode.width}%`,
                          }}
                        >
                          <QRCode
                            value={generateQRCode(previewData.certificateId)}
                            size={60}
                            fgColor="#000000"
                            bgColor="transparent"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Certificate Generation
              </CardTitle>
              <CardDescription>Upload CSV file to generate multiple certificates at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Signature</Label>
                    <Select value={selectedSignature} onValueChange={setSelectedSignature}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select signature" />
                      </SelectTrigger>
                      <SelectContent>
                        {signatures.map((signature) => (
                          <SelectItem key={signature.id} value={signature.id}>
                            {signature.name} - {signature.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>CSV File</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-pink-purple file:text-white hover:file:opacity-80"
                    />
                    <p className="text-xs text-muted-foreground">
                      CSV should include: recipientName, courseName, grade, issueDate (optional)
                    </p>
                  </div>

                  <Button
                    onClick={generateBulkCertificates}
                    disabled={isLoading || bulkData.length === 0}
                    className="w-full bg-gradient-pink-purple hover:opacity-80"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </div>
                    ) : (
                      `Generate ${bulkData.length} Certificates`
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label>CSV Preview</Label>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {bulkData.length > 0 ? (
                      <div className="space-y-2">
                        {bulkData.slice(0, 5).map((item, index) => (
                          <div key={index} className="text-sm border-b pb-2">
                            <div className="font-medium">{item.recipientName}</div>
                            <div className="text-muted-foreground">
                              {item.courseName} - {item.grade}
                            </div>
                          </div>
                        ))}
                        {bulkData.length > 5 && (
                          <div className="text-xs text-muted-foreground">
                            ... and {bulkData.length - 5} more records
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">Upload a CSV file to see preview</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Template Management
              </CardTitle>
              <CardDescription>Manage certificate templates and signatures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Template editor will be available in the next update</p>
                <p className="text-sm text-muted-foreground">
                  Currently using: {templates.length} templates and {signatures.length} signatures
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
