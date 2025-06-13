import { z } from "zod"

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  ),
  confirmPassword: z.string(),
  role: z.enum(["admin", "staff", "student"], { errorMap: () => ({ message: "Please select a valid role" }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
})

// Certificate schemas
export const certificateIssueSchema = z.object({
  recipientName: z.string().min(2, "Recipient name must be at least 2 characters").max(100, "Recipient name must be less than 100 characters"),
  recipientEmail: z.string().email("Please enter a valid email address"),
  courseName: z.string().min(2, "Course name must be at least 2 characters").max(100, "Course name must be less than 100 characters"),
  grade: z.enum(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "Pass"], { errorMap: () => ({ message: "Please select a valid grade" }) }),
  issueDate: z.coerce.date().max(new Date(), { message: "Issue date cannot be in the future" }),
  templateId: z.string(),
  completionDate: z.coerce.date().max(new Date(), { message: "Completion date cannot be in the future" }),
  instructorName: z.string().min(2, "Instructor name must be at least 2 characters").max(100, "Instructor name must be less than 100 characters"),
})

export const bulkUploadSchema = z.object({
  file: z.custom<File>().refine((file) => file instanceof File && file.type === "text/csv", { message: "Only CSV files are allowed" })
    .refine((file) => file instanceof File && file.size <= 5 * 1024 * 1024, { message: "File size must be less than 5MB" }),
  templateId: z.string().min(1, "Please select a certificate template"),
})

// Template schemas
export const templateCreateSchema = z.object({
  name: z.string().min(2, "Template name must be at least 2 characters").max(100, "Template name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  category: z.enum(["achievement", "completion", "appreciation", "participation"], { errorMap: () => ({ message: "Please select a valid category" }) }),
  orientation: z.enum(["landscape", "portrait"], { errorMap: () => ({ message: "Please select an orientation" }) }),
  backgroundImage: z
    .custom<File>()
    .refine((file) => !file || file.type.startsWith("image/"), { message: "Only image files are allowed" })
    .refine((file) => !file || file.size <= 10 * 1024 * 1024, { message: "Image size must be less than 10MB" })
    .optional(),
})

export const templateUpdateSchema = z.object({
  name: z.string().min(2, "Template name must be at least 2 characters").max(100, "Template name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  status: z.enum(["active", "draft", "archived"], { errorMap: () => ({ message: "Please select a valid status" }) }).optional(),
})

// Validation schemas
export const manualValidationSchema = z.object({
  certificateId: z.string().min(3, "Certificate ID must be at least 3 characters").max(50, "Certificate ID must be less than 50 characters"),
})

// User management schemas
export const userCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  ),
  role: z.enum(["admin", "staff", "student"], { errorMap: () => ({ message: "Please select a valid role" }) }),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters").optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  role: z.enum(["admin", "staff", "student"], { errorMap: () => ({ message: "Please select a valid role" }) }).optional(),
})

// Type exports for form data
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type CertificateIssueFormData = z.infer<typeof certificateIssueSchema>
export type BulkUploadFormData = z.infer<typeof bulkUploadSchema>
export type TemplateCreateFormData = z.infer<typeof templateCreateSchema>
export type TemplateUpdateFormData = z.infer<typeof templateUpdateSchema>
export type ManualValidationFormData = z.infer<typeof manualValidationSchema>
export type UserCreateFormData = z.infer<typeof userCreateSchema>
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>
