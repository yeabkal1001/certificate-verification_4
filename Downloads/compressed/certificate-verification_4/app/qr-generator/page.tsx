"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { QrCode, Download, Copy, Check, ArrowLeft, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import QRCodeLib from "qrcode"
import { useTheme } from "next-themes"
import Image from "next/image"

export default function QRGenerator() {
  const [formData, setFormData] = useState({
    certificateId: "",
    recipientName: "",
    courseName: "",
    issuer: "IMS Certify",
    issueDate: "",
  })
  const [qrGenerated, setQrGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Regenerate QR code when theme changes
  useEffect(() => {
    if (mounted && qrGenerated) {
      generateQR()
    }
  }, [theme, mounted])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateQR = async () => {
    if (formData.certificateId && formData.recipientName && formData.courseName) {
      try {
        const verificationUrl = `${window.location.origin}/?verify=${formData.certificateId}`

        // Generate QR code as data URL
        const qrDataUrl = await QRCodeLib.toDataURL(verificationUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: theme === "dark" ? "#ffffff" : "#000000",
            light: theme === "dark" ? "#000000" : "#ffffff",
          },
          errorCorrectionLevel: "M",
        })

        setQrDataUrl(qrDataUrl)
        setQrGenerated(true)
      } catch (error) {
        console.error("Error generating QR code:", error)
      }
    }
  }

  const copyToClipboard = () => {
    const verificationUrl = `${window.location.origin}/?verify=${formData.certificateId}`
    navigator.clipboard.writeText(verificationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement("a")
      link.download = `ims-certificate-${formData.certificateId}.png`
      link.href = qrDataUrl
      link.click()
    }
  }

  const downloadHighResQR = async () => {
    try {
      const verificationUrl = `${window.location.origin}/?verify=${formData.certificateId}`

      // Generate high resolution QR code
      const highResQrDataUrl = await QRCodeLib.toDataURL(verificationUrl, {
        width: 1000,
        margin: 4,
        color: {
          dark: theme === "dark" ? "#ffffff" : "#000000",
          light: theme === "dark" ? "#000000" : "#ffffff",
        },
        errorCorrectionLevel: "H",
      })

      const link = document.createElement("a")
      link.download = `ims-certificate-${formData.certificateId}-hires.png`
      link.href = highResQrDataUrl
      link.click()
    } catch (error) {
      console.error("Error generating high-res QR code:", error)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const verificationUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/?verify=${formData.certificateId}`

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
                  Back to Verification
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="relative h-8 w-8">
                  <Image src="/images/logo.png" alt="IMS Logo" fill className="object-contain" priority />
                </div>
                <h1 className="text-2xl font-bold">
                  QR <span className="text-pink-500">Generator</span>
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

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Generate <span className="text-pink-500">Certificate</span> QR Code
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Create a QR code for your makeup artistry certificate that can be embedded in printable documents
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-2 border-gray-200 dark:border-gray-800 dark:bg-gray-900">
                <CardHeader>
                  <CardTitle>Certificate Information</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Fill in the certificate details to generate a verification QR code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="certificateId" className="text-gray-700 dark:text-gray-300">
                      Certificate ID *
                    </Label>
                    <Input
                      id="certificateId"
                      placeholder="e.g., CERT-2024-001"
                      value={formData.certificateId}
                      onChange={(e) => handleInputChange("certificateId", e.target.value)}
                      className="border-gray-300 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientName" className="text-gray-700 dark:text-gray-300">
                      Recipient Name *
                    </Label>
                    <Input
                      id="recipientName"
                      placeholder="e.g., Emma Johnson"
                      value={formData.recipientName}
                      onChange={(e) => handleInputChange("recipientName", e.target.value)}
                      className="border-gray-300 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="courseName" className="text-gray-700 dark:text-gray-300">
                      Course Name *
                    </Label>
                    <Input
                      id="courseName"
                      placeholder="e.g., Professional Makeup Artistry"
                      value={formData.courseName}
                      onChange={(e) => handleInputChange("courseName", e.target.value)}
                      className="border-gray-300 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issuer" className="text-gray-700 dark:text-gray-300">
                      Issuing Organization
                    </Label>
                    <Input
                      id="issuer"
                      placeholder="e.g., IMS Certify"
                      value={formData.issuer}
                      onChange={(e) => handleInputChange("issuer", e.target.value)}
                      className="border-gray-300 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueDate" className="text-gray-700 dark:text-gray-300">
                      Issue Date
                    </Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => handleInputChange("issueDate", e.target.value)}
                      className="border-gray-300 dark:border-gray-700 focus:border-pink-500 dark:focus:border-pink-400 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <Button
                    onClick={generateQR}
                    disabled={!formData.certificateId || !formData.recipientName || !formData.courseName}
                    className="w-full bg-pink-500 text-white hover:bg-pink-600 disabled:bg-gray-300 dark:disabled:bg-gray-700"
                  >
                    Generate QR Code
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* QR Code Preview */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-2 border-gray-200 dark:border-gray-800 dark:bg-gray-900">
                <CardHeader>
                  <CardTitle>QR Code Preview</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Your generated QR code will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {qrGenerated && qrDataUrl ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6"
                    >
                      {/* Real QR Code */}
                      <div className="flex justify-center">
                        <div
                          className={`p-4 ${theme === "dark" ? "bg-black" : "bg-white"} border-2 ${theme === "dark" ? "border-gray-700" : "border-gray-200"} rounded-lg`}
                        >
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <img
                              src={qrDataUrl || "/placeholder.svg"}
                              alt="Certificate Verification QR Code"
                              className="w-64 h-64"
                            />
                          </motion.div>
                        </div>
                      </div>

                      {/* Certificate Info */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Certificate Details:</h4>
                        <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                          <p>
                            <span className="font-medium">ID:</span> {formData.certificateId}
                          </p>
                          <p>
                            <span className="font-medium">Recipient:</span> {formData.recipientName}
                          </p>
                          <p>
                            <span className="font-medium">Course:</span> {formData.courseName}
                          </p>
                          {formData.issuer && (
                            <p>
                              <span className="font-medium">Issuer:</span> {formData.issuer}
                            </p>
                          )}
                          {formData.issueDate && (
                            <p>
                              <span className="font-medium">Date:</span>{" "}
                              {new Date(formData.issueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Verification URL */}
                      <div className="space-y-2">
                        <Label className="text-gray-700 dark:text-gray-300">Verification URL</Label>
                        <div className="flex space-x-2">
                          <Textarea
                            value={verificationUrl}
                            readOnly
                            className="flex-1 text-sm font-mono resize-none dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                            rows={2}
                          />
                          <Button
                            onClick={copyToClipboard}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 dark:border-gray-700 dark:text-gray-300"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        <Button onClick={downloadQR} className="w-full bg-pink-500 text-white hover:bg-pink-600">
                          <Download className="h-4 w-4 mr-2" />
                          Download QR Code (Standard)
                        </Button>
                        <Button
                          onClick={downloadHighResQR}
                          variant="outline"
                          className="w-full border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white dark:border-pink-400 dark:text-pink-400 dark:hover:bg-pink-500 dark:hover:text-black"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download High Resolution QR Code
                        </Button>
                      </div>

                      {/* Instructions */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">How to use:</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>1. Download the QR code image (standard or high-res)</li>
                          <li>2. Add it to your makeup artistry certificate design</li>
                          <li>3. Recipients can scan with any QR scanner to verify</li>
                          <li>4. High-res version is recommended for print materials</li>
                        </ul>
                      </div>

                      {/* Technical Details */}
                      <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-200 dark:border-pink-800">
                        <h4 className="font-medium mb-2 text-pink-800 dark:text-pink-300">Technical Specifications:</h4>
                        <ul className="text-sm text-pink-700 dark:text-pink-400 space-y-1">
                          <li>• Standard: 300x300px, Error Correction Level M</li>
                          <li>• High-res: 1000x1000px, Error Correction Level H</li>
                          <li>• Format: PNG with transparent background support</li>
                          <li>• Compatible with all standard QR code scanners</li>
                        </ul>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600">
                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.05, 0.95, 1],
                        }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 5,
                          repeatType: "reverse",
                        }}
                      >
                        <div className="relative">
                          <QrCode className="h-24 w-24 mb-4" />
                          <div className="absolute top-0 right-0">
                            <div className="relative h-6 w-6">
                              <Image src="/images/logo.png" alt="IMS Logo" fill className="object-contain" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      <p>Fill in the form to generate your certificate QR code</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
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
