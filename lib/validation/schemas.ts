import * as yup from "yup"

// Auth schemas
export const loginSchema = yup.object({
  email: yup.string().email("Please enter a valid email address").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
})

export const registerSchema = yup.object({
  name: yup
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .required("Name is required"),
  email: yup.string().email("Please enter a valid email address").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
  role: yup.string().oneOf(["admin", "staff", "student"], "Please select a valid role").required("Role is required"),
})

export const forgotPasswordSchema = yup.object({
  email: yup.string().email("Please enter a valid email address").required("Email is required"),
})

export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
})

// Certificate schemas
export const certificateIssueSchema = yup.object({
  recipientName: yup
    .string()
    .min(2, "Recipient name must be at least 2 characters")
    .max(100, "Recipient name must be less than 100 characters")
    .required("Recipient name is required"),
  recipientEmail: yup.string().email("Please enter a valid email address").required("Recipient email is required"),
  courseName: yup
    .string()
    .min(2, "Course name must be at least 2 characters")
    .max(100, "Course name must be less than 100 characters")
    .required("Course name is required"),
  grade: yup
    .string()
    .oneOf(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "Pass"], "Please select a valid grade")
    .required("Grade is required"),
  issueDate: yup.date().max(new Date(), "Issue date cannot be in the future").required("Issue date is required"),
  templateId: yup.string().required("Please select a certificate template"),
  completionDate: yup
    .date()
    .max(new Date(), "Completion date cannot be in the future")
    .required("Completion date is required"),
  instructorName: yup
    .string()
    .min(2, "Instructor name must be at least 2 characters")
    .max(100, "Instructor name must be less than 100 characters")
    .required("Instructor name is required"),
})

export const bulkUploadSchema = yup.object({
  file: yup
    .mixed<File>()
    .required("Please select a CSV file")
    .test("fileType", "Only CSV files are allowed", (value) => {
      return value && value.type === "text/csv"
    })
    .test("fileSize", "File size must be less than 5MB", (value) => {
      return value && value.size <= 5 * 1024 * 1024
    }),
  templateId: yup.string().required("Please select a certificate template"),
})

// Template schemas
export const templateCreateSchema = yup.object({
  name: yup
    .string()
    .min(2, "Template name must be at least 2 characters")
    .max(100, "Template name must be less than 100 characters")
    .required("Template name is required"),
  description: yup.string().max(500, "Description must be less than 500 characters"),
  category: yup
    .string()
    .oneOf(["achievement", "completion", "appreciation", "participation"], "Please select a valid category")
    .required("Category is required"),
  orientation: yup
    .string()
    .oneOf(["landscape", "portrait"], "Please select an orientation")
    .required("Orientation is required"),
  backgroundImage: yup
    .mixed<File>()
    .test("fileType", "Only image files are allowed", (value) => {
      if (!value) return true // Optional field
      return value.type.startsWith("image/")
    })
    .test("fileSize", "Image size must be less than 10MB", (value) => {
      if (!value) return true // Optional field
      return value.size <= 10 * 1024 * 1024
    }),
})

export const templateUpdateSchema = yup.object({
  name: yup
    .string()
    .min(2, "Template name must be at least 2 characters")
    .max(100, "Template name must be less than 100 characters"),
  description: yup.string().max(500, "Description must be less than 500 characters"),
  status: yup.string().oneOf(["active", "draft", "archived"], "Please select a valid status"),
})

// Validation schemas
export const manualValidationSchema = yup.object({
  certificateId: yup
    .string()
    .min(3, "Certificate ID must be at least 3 characters")
    .max(50, "Certificate ID must be less than 50 characters")
    .required("Certificate ID is required"),
})

// User management schemas
export const userCreateSchema = yup.object({
  name: yup
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .required("Name is required"),
  email: yup.string().email("Please enter a valid email address").required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    )
    .required("Password is required"),
  role: yup.string().oneOf(["admin", "staff", "student"], "Please select a valid role").required("Role is required"),
})

export const userUpdateSchema = yup.object({
  name: yup.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  email: yup.string().email("Please enter a valid email address"),
  role: yup.string().oneOf(["admin", "staff", "student"], "Please select a valid role"),
})

// Type exports for form data
export type LoginFormData = yup.InferType<typeof loginSchema>
export type RegisterFormData = yup.InferType<typeof registerSchema>
export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>
export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>
export type CertificateIssueFormData = yup.InferType<typeof certificateIssueSchema>
export type BulkUploadFormData = yup.InferType<typeof bulkUploadSchema>
export type TemplateCreateFormData = yup.InferType<typeof templateCreateSchema>
export type TemplateUpdateFormData = yup.InferType<typeof templateUpdateSchema>
export type ManualValidationFormData = yup.InferType<typeof manualValidationSchema>
export type UserCreateFormData = yup.InferType<typeof userCreateSchema>
export type UserUpdateFormData = yup.InferType<typeof userUpdateSchema>
