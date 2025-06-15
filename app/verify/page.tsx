"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ManualVerification } from "@/components/manual-verification"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield, Scan, FileText } from "lucide-react"
import { certificatesApi } from "@/lib/api/certificates"
import type { VerificationResult as VerificationResultType } from "@/types/certificate"
import { LazyQRScanner, LazyVerificationResult } from "@/components/lazy-components"
import { LazyComponent } from "@/lib/lazy-load"

export default function VerifyPage() {
  const [verificationResult, setVerificationResult] = useState<VerificationResultType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  // Check for certificate ID in URL params on page load
  useEffect(() => {
    const certificateId = searchParams.get("id")
    if (certificateId) {
      handleVerification(certificateId)
    }
  }, [searchParams])

  const handleVerification = async (certificateId: string) => {
    setIsLoading(true)
    try {
      const result = await certificatesApi.verify(certificateId)
      setVerificationResult(result)
    } catch (error) {
      console.error("Verification failed:", error)
      setVerificationResult({
        isValid: false,
        error: "Verification failed. Please try again.",
        verificationDate: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-pink-purple rounded-full mb-6 glow-pink-purple">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="text-gradient-pink-purple">Verify</span> Your Certificate
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Instantly verify the authenticity of Ethiopian makeup artistry certificates using our secure verification
            system
          </p>
        </div>

        {/* Verification Methods */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* QR Scanner */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-brand-pink" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>Scan the QR code on your certificate for instant verification</CardDescription>
            </CardHeader>
            <CardContent>
              <LazyComponent>
                <LazyQRScanner onScan={handleVerification} isLoading={isLoading} />
              </LazyComponent>
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-purple" />
                Manual Verification
              </CardTitle>
              <CardDescription>Enter your certificate ID manually to verify</CardDescription>
            </CardHeader>
            <CardContent>
              <ManualVerification onVerify={handleVerification} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className="animate-fade-in">
            <Separator className="mb-8" />
            <LazyComponent>
              <LazyVerificationResult result={verificationResult} />
            </LazyComponent>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-pink-purple rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure Verification</h3>
            <p className="text-muted-foreground">
              Advanced cryptographic verification ensures certificate authenticity
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-pink-purple rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Scan className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">QR Code Support</h3>
            <p className="text-muted-foreground">Scan QR codes directly from certificates for instant verification</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-pink-purple rounded-lg mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Results</h3>
            <p className="text-muted-foreground">
              Get verification results immediately with detailed certificate information
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
