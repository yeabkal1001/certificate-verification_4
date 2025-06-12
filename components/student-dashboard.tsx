"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Download, Eye, Share2, Award, Calendar, TrendingUp, QrCode, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { mockCertificates } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"
import QRCodeLib from "qrcode"

export function StudentDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null)
  const [shareQrDataUrl, setShareQrDataUrl] = useState("")

  // Filter certificates for current user (mock logic)
  const userCertificates = mockCertificates.filter((cert) =>
    cert.recipientName.toLowerCase().includes(user?.name?.toLowerCase() || ""),
  )

  const handleDownload = async (certificateId: string, format: "pdf" | "png") => {
    try {
      if (format === "pdf") {
        // In a real app, this would call an API
        const response = await fetch(`/api/certificates/${certificateId}/download?format=pdf`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `Certificate_${certificateId}.pdf`
        link.click()
        window.URL.revokeObjectURL(url)
      } else {
        // For PNG, simulate download
        const link = document.createElement("a")
        link.download = `Certificate_${certificateId}.png`
        link.href = "/placeholder.svg?height=800&width=1200" // In real app, this would be the actual certificate image
        link.click()
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

  const handleShare = async (certificate: any) => {
    setSelectedCertificate(certificate)

    try {
      // Generate QR code for certificate sharing
      const shareUrl = `${window.location.origin}/certificate/${certificate.id}?public=true`
      const qrDataUrl = await QRCodeLib.toDataURL(shareUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      })
      setShareQrDataUrl(qrDataUrl)
    } catch (error) {
      console.error("Error generating QR code:", error)
    }

    setIsShareDialogOpen(true)
  }

  const copyShareLink = () => {
    if (selectedCertificate) {
      const shareUrl = `${window.location.origin}/certificate/${selectedCertificate.id}?public=true`
      navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link Copied",
        description: "Certificate sharing link copied to clipboard",
      })
    }
  }

  const downloadQRCode = () => {
    if (shareQrDataUrl) {
      const link = document.createElement("a")
      link.download = `${selectedCertificate?.recipientName}_certificate_qr.png`
      link.href = shareQrDataUrl
      link.click()

      toast({
        title: "QR Code Downloaded",
        description: "QR code has been downloaded to your device",
      })
    }
  }

  const stats = {
    totalCertificates: userCertificates.length,
    activeCertificates: userCertificates.filter((c) => c.status === "active").length,
    completedCourses: userCertificates.length,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">Manage your certificates and track your achievements</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Certificates</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCertificates}</div>
              <p className="text-xs text-muted-foreground">Total earned certificates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Certificates</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCertificates}</div>
              <p className="text-xs text-muted-foreground">Currently valid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCourses}</div>
              <p className="text-xs text-muted-foreground">Learning achievements</p>
            </CardContent>
          </Card>
        </div>

        {/* Certificates Section */}
        <Card>
          <CardHeader>
            <CardTitle>My Certificates</CardTitle>
            <CardDescription>View and manage your earned certificates</CardDescription>
          </CardHeader>
          <CardContent>
            {userCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCertificates.map((certificate) => (
                  <motion.div
                    key={certificate.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-2 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={certificate.status === "active" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {certificate.status}
                          </Badge>
                          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-full">
                            <Award className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <CardTitle className="text-lg">{certificate.courseName}</CardTitle>
                        <CardDescription>Certificate ID: {certificate.certificateId}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Issued:</span>
                            <span>{new Date(certificate.issueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Grade:</span>
                            <span className="font-semibold">{certificate.grade}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Issuer:</span>
                            <span>{certificate.issuer}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Link href={`/certificate/${certificate.id}`}>
                            <Button variant="outline" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDownload(certificate.certificateId, "pdf")}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDownload(certificate.certificateId, "png")}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PNG
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleShare(certificate)}
                            >
                              <Share2 className="h-4 w-4 mr-1" />
                              Share
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-full w-fit mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't earned any certificates yet. Complete a course to get your first certificate!
                </p>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                    Verify a Certificate
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Certificate</DialogTitle>
            <DialogDescription>
              Share your certificate with others using QR code or link. No login required to view.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* QR Code */}
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg border inline-block">
                {shareQrDataUrl && (
                  <img src={shareQrDataUrl || "/placeholder.svg"} alt="Share QR Code" className="h-48 w-48" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Scan to view certificate</p>
              <Button variant="outline" size="sm" onClick={downloadQRCode} className="mt-2">
                <QrCode className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>

            {/* Share Link */}
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value={
                    selectedCertificate
                      ? `${window.location.origin}/certificate/${selectedCertificate.id}?public=true`
                      : ""
                  }
                  readOnly
                  className="flex-1"
                />
                <Button onClick={copyShareLink} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can view the certificate without signing in
              </p>
            </div>

            {/* Certificate Info */}
            {selectedCertificate && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="font-medium text-sm">{selectedCertificate.courseName}</h4>
                <p className="text-xs text-muted-foreground">
                  Issued to {selectedCertificate.recipientName} •{" "}
                  {new Date(selectedCertificate.issueDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
