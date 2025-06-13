"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, Download, Share2, Calendar, User, Award, Hash, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { mockCertificates } from "@/lib/mock-data"

export default function VerificationResultPage() {
  const params = useParams()
  const code = params.code as string
  const [isLoading, setIsLoading] = useState(true)
  const [certificate, setCertificate] = useState<any>(null)
  const [isValid, setIsValid] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const verifyCertificate = async () => {
      setIsLoading(true)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const found = mockCertificates.find((cert) => cert.certificateId.toLowerCase() === code.toLowerCase())

      if (found) {
        setCertificate(found)
        setIsValid(true)
      } else {
        setIsValid(false)
      }

      setIsLoading(false)
    }

    verifyCertificate()
  }, [code])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link Copied",
      description: "Verification link copied to clipboard",
    })
  }

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Certificate download will begin shortly",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Verifying certificate...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Verification
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          {isValid && certificate ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card className="border-2 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mx-auto mb-4"
                  >
                    <div className="bg-green-500 p-4 rounded-full">
                      <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                  </motion.div>
                  <CardTitle className="text-3xl text-green-700 dark:text-green-400">Certificate Verified!</CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-500">
                    This certificate is authentic and valid
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                        <p className="text-sm text-muted-foreground mb-2">Issuer</p>
                        <p className="font-semibold">{certificate.issuer}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Grade</p>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          {certificate.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleDownload} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </Button>
                    <Button variant="outline" onClick={handleShare} className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Verification
                    </Button>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Verification Details:</strong> This certificate was verified on{" "}
                      {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}. The verification confirms
                      that this certificate is authentic and was issued by {certificate.issuer}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card className="border-2 border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="mx-auto mb-4"
                  >
                    <div className="bg-red-500 p-4 rounded-full">
                      <XCircle className="h-12 w-12 text-white" />
                    </div>
                  </motion.div>
                  <CardTitle className="text-3xl text-red-700 dark:text-red-400">Certificate Not Found</CardTitle>
                  <CardDescription className="text-red-600 dark:text-red-500">
                    The certificate code "{code}" could not be verified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Possible reasons:</h4>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      <li>• The certificate code was entered incorrectly</li>
                      <li>• The certificate has been revoked or expired</li>
                      <li>• The certificate was not issued by IMS Certify</li>
                      <li>• The certificate is not yet active in our system</li>
                    </ul>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      If you believe this is an error, please contact the issuing institution.
                    </p>
                    <Link href="/">
                      <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                        Try Another Certificate
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
