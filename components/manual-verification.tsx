"use client"

import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useValidation } from "@/hooks/use-validation"
import { manualValidationSchema, type ManualValidationFormData } from "@/lib/validation/schemas"
import { Search, Loader2 } from "lucide-react"

interface ManualVerificationProps {
  onResult?: (result: any) => void
}

export function ManualVerification({ onResult }: ManualVerificationProps) {
  const { validateCertificate, loading, error } = useValidation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ManualValidationFormData>({
    resolver: yupResolver(manualValidationSchema),
  })

  const onSubmit = async (data: ManualValidationFormData) => {
    try {
      const result = await validateCertificate(data.certificateId)
      onResult?.(result)
      reset()
    } catch (error) {
      // Error is handled by the hook and global interceptor
    }
  }

  return (
    <Card className="w-full bg-gray-800/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Search className="h-5 w-5" />
          Manual Verification
        </CardTitle>
        <CardDescription className="text-gray-300">Enter a certificate ID to verify its authenticity</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="certificateId" className="text-gray-200">
              Certificate ID
            </Label>
            <Input
              id="certificateId"
              placeholder="Enter certificate ID (e.g., CERT-2024-001)"
              className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
              {...register("certificateId")}
            />
            {errors.certificateId && <p className="text-sm text-red-400">{errors.certificateId.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Verify Certificate
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 text-sm text-gray-400">
          <p className="font-medium mb-2">Example Certificate IDs:</p>
          <ul className="space-y-1 text-xs">
            <li>• CERT-2024-001 (Valid Certificate)</li>
            <li>• CERT-2024-002 (Valid Certificate)</li>
            <li>• INVALID-ID (Invalid Certificate)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
