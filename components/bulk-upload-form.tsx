"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface BulkUploadFormProps {
  onClose: () => void
  onCertificatesAdded?: (certificates: any[]) => void
}

// Mock templates (in real app, this would come from template management)
const mockTemplates = [
  {
    id: "template_1",
    name: "Classic Elegance",
    category: "Professional",
    status: "active",
  },
  {
    id: "template_2",
    name: "Modern Minimalist",
    category: "Modern",
    status: "active",
  },
  {
    id: "template_3",
    name: "Luxury Gold",
    category: "Premium",
    status: "active",
  },
]

const generateCertificateId = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `CERT-${year}-${random}`
}

export function BulkUploadForm({ onClose, onCertificatesAdded }: BulkUploadFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [csvData, setCsvData] = useState<any[]>([])
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)

      // Parse CSV manually
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split("\n")
        const headers = lines[0].split(",").map((h) => h.trim())

        const data = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => {
            const values = line.split(",").map((v) => v.trim())
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = values[index] || ""
            })
            return obj
          })

        setCsvData(data)
        toast({
          title: "File Parsed",
          description: `Found ${data.length} records in the CSV file`,
        })
      }

      reader.readAsText(file)

      toast({
        title: "File Selected",
        description: `${file.name} is ready for upload`,
      })
    }
  }

  const handleUpload = async () => {
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select a certificate template",
        variant: "destructive",
      })
      return
    }

    if (csvData.length === 0) {
      toast({
        title: "Error",
        description: "No valid data found in the CSV file",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Create certificates from CSV data
      const newCertificates = csvData.map((row, index) => ({
        id: `cert_bulk_${Date.now()}_${index}`,
        certificateId: row.certificateId || generateCertificateId(),
        recipientName: row.recipientName || row["Recipient Name"] || "",
        courseName: row.courseName || row["Course Name"] || "",
        issueDate: row.issueDate || row["Issue Date"] || new Date().toISOString().split("T")[0],
        issuer: row.issuer || row["Issuer"] || "IMS Certify",
        grade: row.grade || row["Grade"] || "Pass",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        template: selectedTemplate,
      }))

      // Notify parent component
      onCertificatesAdded?.(newCertificates)

      toast({
        title: "Upload Successful",
        description: `${newCertificates.length} certificates have been processed using ${mockTemplates.find((t) => t.id === selectedTemplate)?.name} template`,
      })

      onClose()
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to process the file. Please check the format and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadTemplate = () => {
    // Create CSV content with standardized format
    const csvContent = [
      "certificateId,recipientName,courseName,issueDate,issuer,grade",
      `${generateCertificateId()},John Doe,Professional Makeup Artistry,${new Date().toISOString().split("T")[0]},IMS Certify,Distinction`,
      `${generateCertificateId()},Jane Smith,Advanced Hair Styling,${new Date().toISOString().split("T")[0]},IMS Certify,Excellence`,
      `${generateCertificateId()},Mike Johnson,Beauty Therapy Basics,${new Date().toISOString().split("T")[0]},IMS Certify,Merit`,
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "certificate_bulk_upload_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded to your device",
    })
  }

  const activeTemplates = mockTemplates.filter((t) => t.status === "active")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV File Upload</CardTitle>
              <CardDescription>Upload a CSV file containing multiple certificate records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Select Certificate Template</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Choose the template that will be used for all certificates in this batch
                  </p>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Download Template</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Download the CSV template to ensure your data is formatted correctly
                  </p>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                </div>

                <div>
                  <Label>Upload CSV File</Label>
                  <div className="mt-2">
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                        {uploadedFile ? (
                          <div className="space-y-2">
                            <FileText className="h-8 w-8 mx-auto text-green-600" />
                            <p className="text-sm font-medium">{uploadedFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                            {csvData.length > 0 && (
                              <p className="text-xs text-green-600">{csvData.length} records found</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload CSV file or drag and drop</p>
                          </div>
                        )}
                      </div>
                      <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>

                {csvData.length > 0 && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Preview Data:</h4>
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-1">Certificate ID</th>
                            <th className="text-left p-1">Recipient</th>
                            <th className="text-left p-1">Course</th>
                            <th className="text-left p-1">Date</th>
                            <th className="text-left p-1">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-1">{row.certificateId || "Auto-generated"}</td>
                              <td className="p-1">{row.recipientName || row["Recipient Name"] || "N/A"}</td>
                              <td className="p-1">{row.courseName || row["Course Name"] || "N/A"}</td>
                              <td className="p-1">{row.issueDate || row["Issue Date"] || "N/A"}</td>
                              <td className="p-1">{row.grade || row["Grade"] || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvData.length > 5 && (
                        <p className="text-xs text-muted-foreground mt-2">... and {csvData.length - 5} more records</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• certificateId (optional - will be auto-generated in format CERT-YYYY-NNNN)</li>
                    <li>• recipientName (required)</li>
                    <li>• courseName (required)</li>
                    <li>• issueDate (YYYY-MM-DD format, optional)</li>
                    <li>• issuer (optional - defaults to "IMS Certify")</li>
                    <li>• grade (optional - defaults to "Pass")</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Bulk Entry</CardTitle>
              <CardDescription>Enter multiple certificates manually using the form interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Manual bulk entry form will be available in a future update. For now, please use the CSV upload option
                  or create certificates individually.
                </p>
                <Button variant="outline" onClick={onClose}>
                  Use Individual Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={isLoading || !uploadedFile || !selectedTemplate || csvData.length === 0}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </div>
          ) : (
            `Upload ${csvData.length} Certificates`
          )}
        </Button>
      </div>
    </div>
  )
}
