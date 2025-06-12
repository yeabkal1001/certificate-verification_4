"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Download, Share2, Calendar, User, GraduationCap, Building } from "lucide-react"
import type { VerificationResult as VerificationResultType } from "@/types/certificate"
import { formatDate, downloadBlob } from "@/lib/utils"
import { certificatesApi } from "@/lib/api/certificates"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface VerificationResultProps {
  result: VerificationResultType
}

export function VerificationResult({ result }: VerificationResultProps) {
  const { isValid, certificate, verificationDate, error } = result
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async (format: "pdf" | "png") => {
    if (!certificate) return

    try {
      setIsDownloading(true)
      const blob = await certificatesApi.download(certificate.id, format)
      downloadBlob(blob, `${certificate.recipientName}_Certificate.${format}`)
    } catch (error) {
      console.error(`Error downloading ${format}:`, error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = () => {
    if (!certificate) return

    // Use Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: `${certificate.courseName} Certificate`,
          text: `View ${certificate.recipientName}'s certificate for ${certificate.courseName}`,
          url: `${window.location.origin}/verify?id=${certificate.certificateId}`,
        })
        .catch((err) => console.error("Error sharing:", err))
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/verify?id=${certificate.certificateId}`)
      alert("Certificate link copied to clipboard!")
    }
  }

  if (!isValid) {
    return (
      <Card className="border-red-500/50 bg-red-500/5" role="alert" aria-live="polite">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <XCircle className="w-5 h-5" />
            Certificate Not Valid
          </CardTitle>
          <CardDescription>The certificate could not be verified</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {error || "This certificate ID was not found in our database or may have been revoked."}
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Verified on: {formatDate(verificationDate)}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!certificate) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="border-green-500/50 bg-green-500/5"
      role="region"
      aria-label="Certificate verification result"
      aria-live="polite"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400">
          <CheckCircle className="w-5 h-5" />
          Certificate Verified
        </CardTitle>
        <CardDescription>This certificate is authentic and valid</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Certificate Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-pink" />
              <div>
                <p className="text-sm text-muted-foreground">Recipient</p>
                <p className="font-semibold">{certificate.recipientName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-brand-purple" />
              <div>
                <p className="text-sm text-muted-foreground">Course</p>
                <p className="font-semibold">{certificate.courseName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-pink" />
              <div>
                <p className="text-sm text-muted-foreground">Institution</p>
                <p className="font-semibold">{certificate.institution}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-purple" />
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-semibold">{formatDate(certificate.issueDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-pink" />
              <div>
                <p className="text-sm text-muted-foreground">Expiry Date</p>
                <p className="font-semibold">
                  {certificate.expiryDate ? formatDate(certificate.expiryDate) : "No expiry"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                className={
                  certificate.status === "active"
                    ? "bg-gradient-pink-purple text-white"
                    : certificate.status === "revoked"
                      ? "bg-red-500 text-white"
                      : "bg-yellow-500 text-white"
                }
              >
                {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Additional Details */}
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Certificate Number</p>
            <p className="font-mono">{certificate.certificateId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Instructor</p>
            <p>{certificate.instructor || "Not specified"}</p>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-gradient-pink-purple hover:opacity-90 transition-opacity"
            onClick={() => handleDownload("pdf")}
            disabled={isDownloading}
            aria-label="Download certificate as PDF"
          >
            {isDownloading ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDownload("png")}
            disabled={isDownloading}
            aria-label="Download certificate as PNG"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PNG
          </Button>
          <Button variant="outline" onClick={handleShare} aria-label="Share certificate">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Verification Info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p>✓ Certificate verified on {formatDate(verificationDate)}</p>
          <p>✓ Digital signature validated</p>
          <p>✓ Institution credentials confirmed</p>
          {certificate.verificationCount && (
            <p>
              ✓ Verified {certificate.verificationCount} {certificate.verificationCount === 1 ? "time" : "times"}{" "}
              previously
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
