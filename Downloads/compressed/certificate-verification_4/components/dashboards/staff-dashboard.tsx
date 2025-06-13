"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Award, Upload, FileText, Calendar, User, GraduationCap, Plus, Eye, Download } from "lucide-react"

// Mock data
const recentCertificates = [
  {
    id: "CERT-2024-001",
    recipient: "Almaz Tadesse",
    course: "Advanced Makeup Artistry",
    issueDate: "2024-01-15",
    status: "issued",
  },
  {
    id: "CERT-2024-002",
    recipient: "Hanan Mohammed",
    course: "Bridal Makeup Specialist",
    issueDate: "2024-01-14",
    status: "issued",
  },
]

const courses = [
  "Basic Makeup Course",
  "Advanced Makeup Artistry",
  "Bridal Makeup Specialist",
  "Special Effects Makeup",
  "Professional Makeup Artist Certification",
]

const grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "Pass", "Fail"]

export function StaffDashboard() {
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    course: "",
    grade: "",
    completionDate: "",
    instructor: "",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Certificate Issued",
        description: `Certificate has been successfully issued to ${formData.recipientName}`,
      })

      // Reset form
      setFormData({
        recipientName: "",
        recipientEmail: "",
        course: "",
        grade: "",
        completionDate: "",
        instructor: "",
        notes: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to issue certificate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Staff Dashboard</h1>
        <p className="text-muted-foreground">Issue certificates and manage student records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient-pink-purple">156</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient-pink-purple">89</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gradient-pink-purple">5</div>
            <p className="text-xs text-muted-foreground">Available programs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Issue Certificate Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-pink" />
              Issue New Certificate
            </CardTitle>
            <CardDescription>Create and issue a certificate for a student</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Student Name</Label>
                  <Input
                    id="recipientName"
                    placeholder="Enter student name"
                    value={formData.recipientName}
                    onChange={(e) => updateFormData("recipientName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Student Email</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="Enter student email"
                    value={formData.recipientEmail}
                    onChange={(e) => updateFormData("recipientEmail", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select value={formData.course} onValueChange={(value) => updateFormData("course", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select value={formData.grade} onValueChange={(value) => updateFormData("grade", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="completionDate">Completion Date</Label>
                  <Input
                    id="completionDate"
                    type="date"
                    value={formData.completionDate}
                    onChange={(e) => updateFormData("completionDate", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input
                  id="instructor"
                  placeholder="Enter instructor name"
                  value={formData.instructor}
                  onChange={(e) => updateFormData("instructor", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes or comments"
                  value={formData.notes}
                  onChange={(e) => updateFormData("notes", e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-pink-purple hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Issuing Certificate..." : "Issue Certificate"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-purple" />
              Recent Certificates
            </CardTitle>
            <CardDescription>Recently issued certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCertificates.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{cert.recipient}</p>
                    <p className="text-sm text-muted-foreground">{cert.course}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">{cert.status}</Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Upload Certificates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
