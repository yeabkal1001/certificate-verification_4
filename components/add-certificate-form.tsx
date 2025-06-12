"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

interface AddCertificateFormProps {
  onClose: () => void
  onCertificateAdded?: (certificate: any) => void
}

const generateCertificateId = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `CERT-${year}-${random}`
}

export function AddCertificateForm({ onClose, onCertificateAdded }: AddCertificateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    certificateId: generateCertificateId(),
    recipientName: "",
    courseName: "",
    issueDate: new Date(),
    issuer: "",
    grade: "",
  })

  useEffect(() => {
    setFormData((prev) => ({ ...prev, certificateId: generateCertificateId() }))
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData({ ...formData, issueDate: date })
    }
  }

  const handleGenerateNewId = () => {
    setFormData({ ...formData, certificateId: generateCertificateId() })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newCertificate = {
        id: `cert_${Date.now()}`,
        certificateId: formData.certificateId,
        recipientName: formData.recipientName,
        courseName: formData.courseName,
        issueDate: formData.issueDate,
        issuer: formData.issuer || "IMS Certify",
        grade: formData.grade,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Notify parent component
      onCertificateAdded?.(newCertificate)

      toast({
        title: "Certificate Created",
        description: `Certificate for ${formData.recipientName} has been created successfully`,
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create certificate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="certificateId">Certificate ID</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="certificateId"
            name="certificateId"
            value={formData.certificateId}
            onChange={handleInputChange}
            placeholder="Enter certificate ID"
            required
            className="w-full"
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleGenerateNewId}>
            Generate New ID
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="recipientName">Recipient Name</Label>
        <Input
          id="recipientName"
          name="recipientName"
          value={formData.recipientName}
          onChange={handleInputChange}
          placeholder="Enter recipient name"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="courseName">Course Name</Label>
        <Input
          id="courseName"
          name="courseName"
          value={formData.courseName}
          onChange={handleInputChange}
          placeholder="Enter course name"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="issueDate">Issue Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !formData.issueDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.issueDate ? format(formData.issueDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.issueDate}
              onSelect={handleDateChange}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="issuer">Issuer (Optional)</Label>
        <Input
          id="issuer"
          name="issuer"
          value={formData.issuer}
          onChange={handleInputChange}
          placeholder="Enter issuer"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="grade">Grade</Label>
        <Input id="grade" name="grade" value={formData.grade} onChange={handleInputChange} placeholder="Enter grade" />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Certificate"}
      </Button>
    </form>
  )
}
