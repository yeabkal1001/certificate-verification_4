"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Eye, Edit, Plus, Trash2, FileImage, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"

interface CertificateTemplate {
  id: string
  name: string
  description: string
  category: string
  status: "active" | "draft" | "archived"
  createdAt: string
  updatedAt: string
  previewImage: string
  backgroundImage?: string
  textPositions: {
    name: { x: number; y: number }
    course: { x: number; y: number }
    date: { x: number; y: number }
    id: { x: number; y: number }
    signature: { x: number; y: number }
    qr: { x: number; y: number }
  }
  styling: {
    backgroundColor: string
    textColor: string
    accentColor: string
    fontFamily: string
  }
}

const mockTemplates: CertificateTemplate[] = [
  {
    id: "template_1",
    name: "Classic Elegance",
    description: "Traditional certificate design with elegant borders and classic typography",
    category: "Professional",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-03-10T14:30:00Z",
    previewImage: "/placeholder.svg?height=400&width=600",
    textPositions: {
      name: { x: 50, y: 40 },
      course: { x: 50, y: 50 },
      date: { x: 25, y: 75 },
      id: { x: 25, y: 80 },
      signature: { x: 75, y: 75 },
      qr: { x: 85, y: 80 },
    },
    styling: {
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      accentColor: "#d946ef",
      fontFamily: "serif",
    },
  },
  {
    id: "template_2",
    name: "Modern Minimalist",
    description: "Clean, modern design with minimal elements and contemporary styling",
    category: "Modern",
    status: "active",
    createdAt: "2024-02-01T09:15:00Z",
    updatedAt: "2024-03-15T11:20:00Z",
    previewImage: "/placeholder.svg?height=400&width=600",
    textPositions: {
      name: { x: 50, y: 35 },
      course: { x: 50, y: 45 },
      date: { x: 30, y: 70 },
      id: { x: 30, y: 75 },
      signature: { x: 70, y: 70 },
      qr: { x: 80, y: 75 },
    },
    styling: {
      backgroundColor: "#f8fafc",
      textColor: "#334155",
      accentColor: "#ec4899",
      fontFamily: "sans-serif",
    },
  },
  {
    id: "template_3",
    name: "Luxury Gold",
    description: "Premium design with gold accents and sophisticated styling",
    category: "Premium",
    status: "draft",
    createdAt: "2024-03-01T16:45:00Z",
    updatedAt: "2024-03-20T10:10:00Z",
    previewImage: "/placeholder.svg?height=400&width=600",
    textPositions: {
      name: { x: 50, y: 42 },
      course: { x: 50, y: 52 },
      date: { x: 20, y: 78 },
      id: { x: 20, y: 83 },
      signature: { x: 80, y: 78 },
      qr: { x: 90, y: 83 },
    },
    styling: {
      backgroundColor: "#fefce8",
      textColor: "#713f12",
      accentColor: "#f59e0b",
      fontFamily: "serif",
    },
  },
]

export function TemplateManagement() {
  const [templates, setTemplates] = useState(mockTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Omit<CertificateTemplate, "id" | "createdAt" | "updatedAt">>({
    name: "",
    description: "",
    category: "Professional",
    status: "draft",
    previewImage: "/placeholder.svg?height=400&width=600",
    textPositions: {
      name: { x: 50, y: 40 },
      course: { x: 50, y: 50 },
      date: { x: 25, y: 75 },
      id: { x: 25, y: 80 },
      signature: { x: 75, y: 75 },
      qr: { x: 85, y: 80 },
    },
    styling: {
      backgroundColor: "#ffffff",
      textColor: "#1a1a1a",
      accentColor: "#d946ef",
      fontFamily: "serif",
    },
  })
  const { toast } = useToast()

  // Refs for file inputs
  const backgroundImageInputRef = useRef<HTMLInputElement>(null)
  const editBackgroundImageInputRef = useRef<HTMLInputElement>(null)

  const handleEditTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(template)
    setIsEditDialogOpen(true)
  }

  const handlePreviewTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewDialogOpen(true)
  }

  const handleSaveTemplate = () => {
    if (selectedTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === selectedTemplate.id ? { ...selectedTemplate, updatedAt: new Date().toISOString() } : t,
        ),
      )

      toast({
        title: "Template Saved",
        description: "Certificate template has been updated successfully",
      })
      setIsEditDialogOpen(false)
    }
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((t) => t.id !== templateId))
    toast({
      title: "Template Deleted",
      description: "Certificate template has been deleted successfully",
      variant: "destructive",
    })
  }

  const handleSetActive = (templateId: string) => {
    setTemplates(
      templates.map((t) => ({
        ...t,
        status: t.id === templateId ? ("active" as const) : t.status,
      })),
    )
    toast({
      title: "Template Activated",
      description: "Template is now active and available for certificate generation",
    })
  }

  const handleCreateTemplate = () => {
    setIsCreateDialogOpen(true)
  }

  const handleCreateTemplateSave = () => {
    const newId = uuidv4()
    const now = new Date().toISOString()
    const finalNewTemplate: CertificateTemplate = {
      ...newTemplate,
      id: newId,
      createdAt: now,
      updatedAt: now,
    }

    setTemplates([...templates, finalNewTemplate])
    setIsCreateDialogOpen(false)
    setNewTemplate({
      name: "",
      description: "",
      category: "Professional",
      status: "draft",
      previewImage: "/placeholder.svg?height=400&width=600",
      textPositions: {
        name: { x: 50, y: 40 },
        course: { x: 50, y: 50 },
        date: { x: 25, y: 75 },
        id: { x: 25, y: 80 },
        signature: { x: 75, y: 75 },
        qr: { x: 85, y: 80 },
      },
      styling: {
        backgroundColor: "#ffffff",
        textColor: "#1a1a1a",
        accentColor: "#d946ef",
        fontFamily: "serif",
      },
    })

    toast({
      title: "Template Created",
      description: "New certificate template has been created successfully",
    })
  }

  const handleCreateTemplateCancel = () => {
    setIsCreateDialogOpen(false)
    setNewTemplate({
      name: "",
      description: "",
      category: "Professional",
      status: "draft",
      previewImage: "/placeholder.svg?height=400&width=600",
      textPositions: {
        name: { x: 50, y: 40 },
        course: { x: 50, y: 50 },
        date: { x: 25, y: 75 },
        id: { x: 25, y: 80 },
        signature: { x: 75, y: 75 },
        qr: { x: 85, y: 80 },
      },
      styling: {
        backgroundColor: "#ffffff",
        textColor: "#1a1a1a",
        accentColor: "#d946ef",
        fontFamily: "serif",
      },
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTemplate({ ...newTemplate, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewTemplate({ ...newTemplate, [name]: value })
  }

  const handleStylingChange = (name: string, value: string) => {
    setNewTemplate({
      ...newTemplate,
      styling: { ...newTemplate.styling, [name]: value },
    })
  }

  const handleEditStylingChange = (name: string, value: string) => {
    if (selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        styling: { ...selectedTemplate.styling, [name]: value },
      })
    }
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (selectedTemplate) {
      const { name, value } = e.target
      setSelectedTemplate({ ...selectedTemplate, [name]: value })
    }
  }

  const handleEditSelectChange = (name: string, value: string) => {
    if (selectedTemplate) {
      setSelectedTemplate({ ...selectedTemplate, [name]: value })
    }
  }

  // Handle background image upload for new template
  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const backgroundImage = event.target?.result as string
        setNewTemplate({
          ...newTemplate,
          backgroundImage,
        })

        toast({
          title: "Background Image Uploaded",
          description: "Background image has been added to the template",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle background image upload for edit template
  const handleEditBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && selectedTemplate) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const backgroundImage = event.target?.result as string
        setSelectedTemplate({
          ...selectedTemplate,
          backgroundImage,
        })

        toast({
          title: "Background Image Updated",
          description: "Background image has been updated for the template",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Certificate Templates</h3>
          <p className="text-sm text-muted-foreground">Manage certificate templates used for generating certificates</p>
        </div>
        <Button
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          onClick={handleCreateTemplate}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm">{template.category}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      template.status === "active" ? "default" : template.status === "draft" ? "secondary" : "outline"
                    }
                  >
                    {template.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Preview */}
                <div
                  className="aspect-[3/2] rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-300 transition-colors"
                  style={{
                    backgroundColor: template.styling.backgroundColor,
                    backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  onClick={() => handlePreviewTemplate(template)}
                >
                  <div className="text-center" style={{ color: template.styling.textColor }}>
                    <FileImage className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Certificate Preview</p>
                    <p className="text-xs opacity-75">Click to view full preview</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{template.description}</p>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditTemplate(template)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {template.status !== "active" && (
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleSetActive(template.id)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Updated: {new Date(template.updatedAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Template Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{templates.filter((t) => t.status === "active").length}</div>
            <p className="text-sm text-muted-foreground">Active Templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{templates.filter((t) => t.status === "draft").length}</div>
            <p className="text-sm text-muted-foreground">Draft Templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-sm text-muted-foreground">Total Templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>Modify template settings, styling, and layout positions</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Template Name</Label>
                  <Input id="edit-name" name="name" value={selectedTemplate.name} onChange={handleEditInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    value={selectedTemplate.description}
                    onChange={handleEditInputChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={selectedTemplate.category}
                    onValueChange={(value) => handleEditSelectChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Modern">Modern</SelectItem>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Classic">Classic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedTemplate.status}
                    onValueChange={(value) =>
                      handleEditSelectChange("status", value as "active" | "draft" | "archived")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Styling Options */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Styling</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-backgroundColor">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="edit-backgroundColor"
                          value={selectedTemplate.styling.backgroundColor}
                          onChange={(e) => handleEditStylingChange("backgroundColor", e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={selectedTemplate.styling.backgroundColor}
                          onChange={(e) => handleEditStylingChange("backgroundColor", e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-textColor">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          id="edit-textColor"
                          value={selectedTemplate.styling.textColor}
                          onChange={(e) => handleEditStylingChange("textColor", e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={selectedTemplate.styling.textColor}
                          onChange={(e) => handleEditStylingChange("textColor", e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="edit-accentColor"
                        value={selectedTemplate.styling.accentColor}
                        onChange={(e) => handleEditStylingChange("accentColor", e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={selectedTemplate.styling.accentColor}
                        onChange={(e) => handleEditStylingChange("accentColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-fontFamily">Font Family</Label>
                    <Select
                      value={selectedTemplate.styling.fontFamily}
                      onValueChange={(value) => handleEditStylingChange("fontFamily", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="serif">Serif</SelectItem>
                        <SelectItem value="sans-serif">Sans Serif</SelectItem>
                        <SelectItem value="monospace">Monospace</SelectItem>
                        <SelectItem value="cursive">Cursive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Template Preview */}
              <div className="space-y-4">
                <h4 className="font-medium">Live Preview</h4>
                <div
                  className="aspect-[3/2] border rounded-lg p-4 flex flex-col justify-center items-center text-center"
                  style={{
                    backgroundColor: selectedTemplate.styling.backgroundColor,
                    color: selectedTemplate.styling.textColor,
                    backgroundImage: selectedTemplate.backgroundImage
                      ? `url(${selectedTemplate.backgroundImage})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="space-y-2">
                    <div className="text-xs opacity-75">Certificate Preview</div>
                    <h3 className="text-lg font-bold" style={{ color: selectedTemplate.styling.accentColor }}>
                      {selectedTemplate.name}
                    </h3>
                    <div className="text-sm">Sample Certificate Content</div>
                    <div className="text-xs opacity-75">Live preview updates as you edit</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Background Image</Label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
                    onClick={() => editBackgroundImageInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    <input
                      ref={editBackgroundImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditBackgroundImageUpload}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>Full preview of how certificates will look with this template</DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4">
              <div
                className="aspect-[3/2] border rounded-lg p-8 flex flex-col justify-center items-center text-center"
                style={{
                  backgroundColor: selectedTemplate.styling.backgroundColor,
                  color: selectedTemplate.styling.textColor,
                  backgroundImage: selectedTemplate.backgroundImage
                    ? `url(${selectedTemplate.backgroundImage})`
                    : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="space-y-4 w-full max-w-md">
                  <div className="text-sm opacity-75">Certificate of Achievement</div>
                  <h2 className="text-2xl font-bold" style={{ color: selectedTemplate.styling.accentColor }}>
                    John Doe
                  </h2>
                  <div className="text-sm">has successfully completed</div>
                  <h3 className="text-xl font-semibold">Professional Makeup Artistry</h3>
                  <div className="flex justify-between items-end mt-8 text-xs">
                    <div>Date: March 15, 2024</div>
                    <div>ID: CERT-2024-0001</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Preview
                </Button>
                <Button onClick={() => handleEditTemplate(selectedTemplate!)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>Define settings and styling for the new certificate template</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input id="name" name="name" value={newTemplate.name} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newTemplate.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newTemplate.category} onValueChange={(value) => handleSelectChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={newTemplate.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Modern">Modern</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Classic">Classic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Styling Options */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Styling</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="backgroundColor"
                        name="backgroundColor"
                        value={newTemplate.styling.backgroundColor}
                        onChange={(e) => handleStylingChange("backgroundColor", e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={newTemplate.styling.backgroundColor}
                        onChange={(e) => handleStylingChange("backgroundColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textColor">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="textColor"
                        name="textColor"
                        value={newTemplate.styling.textColor}
                        onChange={(e) => handleStylingChange("textColor", e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={newTemplate.styling.textColor}
                        onChange={(e) => handleStylingChange("textColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="accentColor"
                      name="accentColor"
                      value={newTemplate.styling.accentColor}
                      onChange={(e) => handleStylingChange("accentColor", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={newTemplate.styling.accentColor}
                      onChange={(e) => handleStylingChange("accentColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select
                    value={newTemplate.styling.fontFamily}
                    onValueChange={(value) => handleStylingChange("fontFamily", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={newTemplate.styling.fontFamily} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="sans-serif">Sans Serif</SelectItem>
                      <SelectItem value="monospace">Monospace</SelectItem>
                      <SelectItem value="cursive">Cursive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Template Preview */}
            <div className="space-y-4">
              <h4 className="font-medium">Live Preview</h4>
              <div
                className="aspect-[3/2] border rounded-lg p-4 flex flex-col justify-center items-center text-center"
                style={{
                  backgroundColor: newTemplate.styling.backgroundColor,
                  color: newTemplate.styling.textColor,
                  backgroundImage: newTemplate.backgroundImage ? `url(${newTemplate.backgroundImage})` : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="space-y-2">
                  <div className="text-xs opacity-75">Certificate Preview</div>
                  <h3 className="text-lg font-bold" style={{ color: newTemplate.styling.accentColor }}>
                    {newTemplate.name || "Template Name"}
                  </h3>
                  <div className="text-sm">Sample Certificate Content</div>
                  <div className="text-xs opacity-75">Live preview updates as you edit</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload Background Image</Label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer"
                  onClick={() => backgroundImageInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  <input
                    ref={backgroundImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBackgroundImageUpload}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button variant="outline" onClick={handleCreateTemplateCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTemplateSave}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              Create Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
