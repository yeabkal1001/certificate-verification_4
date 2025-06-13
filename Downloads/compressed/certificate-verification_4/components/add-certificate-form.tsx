"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { certificateIssueSchema, type CertificateIssueFormData } from "@/lib/validation/schemas"

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
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
    reset,
  } = useForm<CertificateIssueFormData>({
    resolver: zodResolver(certificateIssueSchema),
    defaultValues: {
      recipientName: "",
      recipientEmail: "",
      courseName: "",
      grade: undefined,
      issueDate: new Date(),
      templateId: "",
      completionDate: new Date(),
      instructorName: "",
    },
  })

  // Generate new certificate ID (not part of Zod schema, so handle separately)
  const [certificateId, setCertificateId] = useState(generateCertificateId())
  useEffect(() => {
    setCertificateId(generateCertificateId())
  }, [])
  const handleGenerateNewId = () => setCertificateId(generateCertificateId())

  const onSubmit = async (data: CertificateIssueFormData) => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const newCertificate = {
        id: `cert_${Date.now()}`,
        certificateId,
        ...data,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      onCertificateAdded?.(newCertificate)
      toast({
        title: "Certificate Created",
        description: `Certificate for ${data.recipientName} has been created successfully`,
      })
      onClose()
      reset()
      setCertificateId(generateCertificateId())
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
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="certificateId">Certificate ID</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="certificateId"
            name="certificateId"
            value={certificateId}
            readOnly
            data-testid="certificate-id-input"
            className="w-full"
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleGenerateNewId} data-testid="generate-id-btn">
            Generate New ID
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="recipientName">Recipient Name</Label>
        <Input
          id="recipientName"
          data-testid="recipient-name-input"
          {...register("recipientName")}
          placeholder="Enter recipient name"
        />
        {errors.recipientName && <span className="text-red-500 text-xs">{errors.recipientName.message}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="recipientEmail">Recipient Email</Label>
        <Input
          id="recipientEmail"
          data-testid="recipient-email-input"
          {...register("recipientEmail")}
          placeholder="Enter recipient email"
        />
        {errors.recipientEmail && <span className="text-red-500 text-xs">{errors.recipientEmail.message}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="courseName">Course Name</Label>
        <Input
          id="courseName"
          data-testid="course-name-input"
          {...register("courseName")}
          placeholder="Enter course name"
        />
        {errors.courseName && <span className="text-red-500 text-xs">{errors.courseName.message}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="grade">Grade</Label>
        <select
          id="grade"
          data-testid="grade-input"
          {...register("grade")}
          className="w-full border rounded px-2 py-1"
        >
          <option value="">Select grade</option>
          <option value="A+">A+</option>
          <option value="A">A</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B">B</option>
          <option value="B-">B-</option>
          <option value="C+">C+</option>
          <option value="C">C</option>
          <option value="Pass">Pass</option>
        </select>
        {errors.grade && <span className="text-red-500 text-xs">{errors.grade.message}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="issueDate">Issue Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !watch("issueDate") && "text-muted-foreground",
              )}
              data-testid="issue-date-picker"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {watch("issueDate") ? format(watch("issueDate"), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={watch("issueDate")}
              onSelect={(date) => date && setValue("issueDate", date)}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.issueDate && <span className="text-red-500 text-xs">{errors.issueDate.message}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="completionDate">Completion Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !watch("completionDate") && "text-muted-foreground",
              )}
              data-testid="completion-date-picker"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {watch("completionDate") ? format(watch("completionDate"), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={watch("completionDate")}
              onSelect={(date) => date && setValue("completionDate", date)}
              disabled={(date) => date > new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.completionDate && <span className="text-red-500 text-xs">{errors.completionDate.message}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="instructorName">Instructor Name</Label>
        <Input
          id="instructorName"
          data-testid="instructor-name-input"
          {...register("instructorName")}
          placeholder="Enter instructor name"
        />
        {errors.instructorName && <span className="text-red-500 text-xs">{errors.instructorName.message}</span>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="templateId">Template</Label>
        <Input
          id="templateId"
          data-testid="template-id-input"
          {...register("templateId")}
          placeholder="Enter template ID"
        />
        {errors.templateId && <span className="text-red-500 text-xs">{errors.templateId.message}</span>}
      </div>
      <Button type="submit" data-testid="submit-certificate" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Certificate"}
      </Button>
    </form>
  )
}
