import { renderHook, act } from "@testing-library/react"
import { useTemplateMutations, useTemplate } from "@/hooks/use-templates"

describe("Template & Signing Round-Trip", () => {
  it("should preserve template layout JSON with signature placeholder", async () => {
    const templateWithSignature = {
      name: "Signature Test Template",
      description: "Template with signature placeholder",
      category: "test",
      backgroundImage: "/test-bg.png",
      orientation: "landscape" as const,
      status: "active" as const,
      layout: {
        recipientName: { x: 15, y: 65, width: 40, height: 8 },
        courseName: { x: 15, y: 75, width: 50, height: 6 },
        signature: { x: 60, y: 85, width: 25, height: 8, placeholder: "SIGNATURE_PLACEHOLDER" },
      },
      styling: {
        recipientName: { fontFamily: "Inter", fontSize: 32, color: "#000" },
        courseName: { fontFamily: "Inter", fontSize: 16, color: "#666" },
        signature: { border: "1px solid #ccc", backgroundColor: "transparent" },
      },
      variables: ["{{recipientName}}", "{{courseName}}", "{{signature}}"],
    }

    const { result: mutationResult } = renderHook(() => useTemplateMutations())

    // Create template
    let createdTemplate
    await act(async () => {
      createdTemplate = await mutationResult.current.createTemplate(templateWithSignature)
    })

    // Fetch template back
    const { result: fetchResult } = renderHook(() => useTemplate(createdTemplate.id))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100)) // Wait for fetch
    })

    const fetchedTemplate = fetchResult.current.data

    // Assert exact JSON match
    expect(fetchedTemplate.layout).toEqual(templateWithSignature.layout)
    expect(fetchedTemplate.styling).toEqual(templateWithSignature.styling)

    // Verify signature placeholder is preserved
    expect(fetchedTemplate.layout.signature.placeholder).toBe("SIGNATURE_PLACEHOLDER")
    expect(fetchedTemplate.styling.signature).toEqual(templateWithSignature.styling.signature)

    // Verify all three dynamic fields are present
    expect(Object.keys(fetchedTemplate.layout)).toContain("recipientName")
    expect(Object.keys(fetchedTemplate.layout)).toContain("courseName")
    expect(Object.keys(fetchedTemplate.layout)).toContain("signature")
  })
})
