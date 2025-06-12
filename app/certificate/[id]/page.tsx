"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Download, Share2, Edit, Trash2, ArrowLeft, QrCode, Calendar, User, Award, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { mockCertificates } from "@/lib/mock-data"
import { Navbar } from "@/components/navbar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function CertificateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const isPublic = searchParams.get("public") === "true"
  const { user } = useAuth()
  const { toast } = useToast()

  const [certificate, setCertificate] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editData, setEditData] = useState({
    recipientName: "",
    courseName: "",
    issueDate: "",
    additionalNotes: "",
  })

  useEffect(() => {
    const loadCertificate = async () => {
      setIsLoading(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const found = mockCertificates.find((cert) => cert.id === id)
      setCertificate(found)
      setIsLoading(false)
    }

    loadCertificate()
  }, [id])

  useEffect(() => {
    if (certificate) {
      setEditData({
        recipientName: certificate.recipientName,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        additionalNotes: certificate.additionalNotes || "",
      })
    }
  }, [certificate])

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleSaveEdit = () => {
    // In a real app, this would make an API call to update the certificate
    setCertificate((prev: any) => ({
      ...prev,
      ...editData,
      updatedAt: new Date().toISOString(),
    }))

    setIsEditMode(false)
    toast({
      title: "Certificate Updated",
      description: "The certificate has been updated successfully",
    })
  }

  const handleCancelEdit = () => {
    setEditData({
      recipientName: certificate.recipientName,
      courseName: certificate.courseName,
      issueDate: certificate.issueDate,
      additionalNotes: certificate.additionalNotes || "",
    })
    setIsEditMode(false)
  }

  const handleDownload = async (format: "pdf" | "png") => {
    try {
      if (format === "pdf") {
        // In a real app, this would call an API to generate the PDF
        const response = await fetch(`/api/certificates/${certificate.id}/download?format=pdf`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${certificate.recipientName.replace(/\s+/g, "_")}_Certificate.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
      } else {
        // For PNG, we can generate it client-side
        const html2canvas = (await import("html2canvas")).default
        const certificateElement = document.querySelector(".certificate-preview")

        if (certificateElement) {
          const canvas = await html2canvas(certificateElement as HTMLElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
          })

          const link = document.createElement("a")
          link.download = `${certificate.recipientName.replace(/\s+/g, "_")}_Certificate.png`
          link.href = canvas.toDataURL()
          link.click()
        }
      }

      toast({
        title: "Download Started",
        description: `Certificate download (${format.toUpperCase()}) completed successfully`,
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error downloading the certificate",
        variant: "destructive",
      })
    }
  }

  const handleShare = () => {
    const verificationUrl = `${window.location.origin}/certificate/${certificate.id}?public=true`
    navigator.clipboard.writeText(verificationUrl)
    toast({
      title: "Link Copied",
      description: "Certificate sharing link copied to clipboard",
    })
  }

  const handleRevoke = () => {
    toast({
      title: "Certificate Revoked",
      description: "The certificate has been revoked successfully",
      variant: "destructive",
    })
    router.push("/dashboard")
  }

  const handleDelete = () => {
    toast({
      title: "Certificate Deleted",
      description: "The certificate has been deleted successfully",
      variant: "destructive",
    })
    router.push("/dashboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {!isPublic && <Navbar />}
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {!isPublic && <Navbar />}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Certificate Not Found</h1>
            <Link href={isPublic ? "/" : "/dashboard"}>
              <Button>Back to {isPublic ? "Home" : "Dashboard"}</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {!isPublic && <Navbar />}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={isPublic ? "/" : "/dashboard"}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {isPublic ? "Home" : "Dashboard"}
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <CardTitle className="text-3xl mb-2">Certificate Details</CardTitle>
                    <CardDescription>
                      {isPublic
                        ? "Publicly shared certificate"
                        : `Complete information for certificate ${certificate.certificateId}`}
                    </CardDescription>
                  </div>
                  <Badge variant={certificate.status === "active" ? "default" : "destructive"} className="text-sm">
                    {certificate.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Certificate Preview */}
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 p-6 rounded-lg border-2 border-dashed border-pink-200 dark:border-pink-800 certificate-preview">
                  <div className="bg-white rounded-lg p-6 shadow-inner">
                    <div className="text-center space-y-3">
                      <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-full w-fit mx-auto">
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-xl font-bold">Certificate of Achievement</h2>
                      <p className="text-sm">This certifies that</p>
                      <h3 className="text-2xl font-bold text-gradient bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                        {certificate.recipientName}
                      </h3>
                      <p className="text-sm">has successfully completed</p>
                      <h4 className="text-lg font-semibold">{certificate.courseName}</h4>
                      <div className="flex justify-between items-end mt-6 pt-4">
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="text-sm font-semibold">
                            {new Date(certificate.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="bg-gray-100 p-2 rounded border">
                            <QrCode className="h-12 w-12 text-gray-400" />
                          </div>
                          <p className="text-xs mt-1">Scan to verify</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Certificate ID</p>
                          <p className="text-xs font-mono">{certificate.certificateId}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate Information */}
                {isEditMode ? (
                  <div className="space-y-4 border rounded-lg p-4">
                    <h3 className="text-lg font-semibold">Edit Certificate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-recipient">Recipient Name</Label>
                        <Input
                          id="edit-recipient"
                          value={editData.recipientName}
                          onChange={(e) => setEditData((prev) => ({ ...prev, recipientName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-course">Course Name</Label>
                        <Input
                          id="edit-course"
                          value={editData.courseName}
                          onChange={(e) => setEditData((prev) => ({ ...prev, courseName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-date">Issue Date</Label>
                        <Input
                          id="edit-date"
                          type="date"
                          value={editData.issueDate}
                          onChange={(e) => setEditData((prev) => ({ ...prev, issueDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-notes">Additional Notes</Label>
                        <Input
                          id="edit-notes"
                          value={editData.additionalNotes}
                          onChange={(e) => setEditData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
                        Save Changes
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Recipient</p>
                          <p className="font-semibold text-lg">{certificate.recipientName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Course</p>
                          <p className="font-semibold">{certificate.courseName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Issue Date</p>
                          <p className="font-semibold">
                            {new Date(certificate.issueDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Certificate ID</p>
                          <p className="font-mono font-semibold">{certificate.certificateId}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Issuer</p>
                        <p className="font-semibold">{certificate.issuer}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Grade</p>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          {certificate.grade}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Created</p>
                        <p className="text-sm">
                          {new Date(certificate.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Actions</h3>

                  <div className="flex flex-wrap gap-4">
                    <Button onClick={() => handleDownload("pdf")}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>

                    <Button variant="outline" onClick={() => handleDownload("png")}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PNG
                    </Button>

                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Certificate
                    </Button>

                    {!isPublic && user?.role === "admin" && (
                      <>
                        <Button variant="outline" onClick={handleEdit}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Certificate
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="text-orange-600 hover:text-orange-700">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke Certificate</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to revoke this certificate? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleRevoke} className="bg-orange-600 hover:bg-orange-700">
                                Revoke Certificate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Certificate</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this certificate? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                Delete Certificate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>

                {/* Verification URL */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Verification URL</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {isPublic
                      ? "Use this URL to verify this certificate:"
                      : "Share this URL to allow others to verify this certificate:"}
                  </p>
                  <code className="text-sm bg-background p-2 rounded border block">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/verify/${certificate.certificateId}`
                      : ""}
                  </code>
                </div>

                {isPublic && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Note:</strong> This certificate is being viewed in public mode. You can verify its
                      authenticity using the verification URL above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
