"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Award, Download, Share2, GraduationCap, TrendingUp, ExternalLink, FileText } from "lucide-react"

// Mock data
const studentCertificates = [
  {
    id: "CERT-2024-001",
    courseName: "Advanced Makeup Artistry",
    issueDate: "2024-01-15",
    expiryDate: "2026-01-15",
    grade: "A+",
    instructor: "Dr. Sarah Johnson",
    status: "active",
    institution: "Ethiopian Beauty Institute",
  },
  {
    id: "CERT-2024-002",
    courseName: "Bridal Makeup Specialist",
    issueDate: "2023-12-10",
    expiryDate: "2025-12-10",
    grade: "A",
    instructor: "Prof. Maria Santos",
    status: "active",
    institution: "Ethiopian Beauty Institute",
  },
]

export function StudentDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (certificateId: string) => {
    setDownloadingId(certificateId)
    try {
      // Simulate download
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Download Started",
        description: "Your certificate is being downloaded.",
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download certificate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleShare = (certificateId: string) => {
    // Simulate LinkedIn sharing
    const shareUrl = `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      `${window.location.origin}/certificate/${certificateId}`,
    )}`
    window.open(shareUrl, "_blank")

    toast({
      title: "Sharing to LinkedIn",
      description: "Opening LinkedIn to share your certificate.",
    })
  }

  const stats = {
    totalCertificates: studentCertificates.length,
    activeCertificates: studentCertificates.filter((c) => c.status === "active").length,
    averageGrade: "A+",
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">View and manage your certificates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient-pink-purple">{stats.totalCertificates}</div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Certificates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient-pink-purple">{stats.activeCertificates}</div>
            <p className="text-xs text-muted-foreground">Currently valid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient-pink-purple">{stats.averageGrade}</div>
            <p className="text-xs text-muted-foreground">Academic performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <CardTitle>My Certificates</CardTitle>
          <CardDescription>Your earned certificates and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          {studentCertificates.length > 0 ? (
            <div className="grid gap-6">
              {studentCertificates.map((certificate) => (
                <div key={certificate.id} className="border border-border/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-pink-purple rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{certificate.courseName}</h3>
                          <p className="text-sm text-muted-foreground">{certificate.institution}</p>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">{certificate.status}</Badge>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Certificate ID:</span>
                        <span className="font-mono">{certificate.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Grade:</span>
                        <span className="font-semibold text-gradient-pink-purple">{certificate.grade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Instructor:</span>
                        <span>{certificate.instructor}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Issue Date:</span>
                        <span>{new Date(certificate.issueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expiry Date:</span>
                        <span>{new Date(certificate.expiryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="text-green-400">Valid</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleDownload(certificate.id)}
                      disabled={downloadingId === certificate.id}
                      className="bg-gradient-pink-purple hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {downloadingId === certificate.id ? "Downloading..." : "Download"}
                    </Button>
                    <Button variant="outline" onClick={() => handleShare(certificate.id)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share to LinkedIn
                    </Button>
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-pink-purple rounded-full mx-auto mb-4 flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't earned any certificates yet. Complete a course to get your first certificate!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Correction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-pink" />
            Request Correction
          </CardTitle>
          <CardDescription>Found an error in your certificate? Request a correction here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            Submit Correction Request
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
