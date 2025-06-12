import { renderHook, act } from "@testing-library/react"
import { useCertificateMutations } from "@/hooks/use-certificates"
import QRCode from "qrcode"

describe("QR Code Bulk Generation", () => {
  it("should generate valid QR codes for multiple certificates", async () => {
    const { result } = renderHook(() => useCertificateMutations())

    const certificateData = [
      { recipientName: "John Doe", courseName: "Makeup Artistry", templateId: "template-1" },
      { recipientName: "Jane Smith", courseName: "Hair Styling", templateId: "template-1" },
      { recipientName: "Bob Johnson", courseName: "Nail Art", templateId: "template-1" },
    ]

    const issuedCertificates = []

    // Issue multiple certificates
    for (const data of certificateData) {
      await act(async () => {
        const certificate = await result.current.issueCertificate(data)
        issuedCertificates.push(certificate)
      })
    }

    // Verify each certificate has valid QR code
    for (const certificate of issuedCertificates) {
      // Check QR code field exists and is Base64 PNG
      expect(certificate.qrCode).toBeDefined()
      expect(typeof certificate.qrCode).toBe("string")
      expect(certificate.qrCode).toMatch(/^data:image\/png;base64,/)

      // Decode QR code and verify URL
      try {
        const qrData = await QRCode.toDataURL(`/verify?code=${certificate.certificateId}`)
        expect(certificate.qrCode).toBe(qrData)

        // Verify the embedded URL is correct
        const expectedUrl = `/verify?code=${certificate.certificateId}`
        const decodedData = await QRCode.toString(certificate.qrCode, { type: "utf8" })
        expect(decodedData).toContain(expectedUrl)
      } catch (error) {
        throw new Error(`Invalid QR code for certificate ${certificate.id}: ${error.message}`)
      }
    }

    // Verify all QR codes are unique
    const qrCodes = issuedCertificates.map((cert) => cert.qrCode)
    const uniqueQrCodes = new Set(qrCodes)
    expect(uniqueQrCodes.size).toBe(qrCodes.length)
  })
})
