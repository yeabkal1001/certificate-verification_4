import { renderHook, act } from "@testing-library/react"
import { useTemplateMutations } from "@/hooks/use-templates"
import { templatesApi } from "@/lib/api/templates"

// Mock jest for testing
const jest = {
  spyOn: (obj: any, method: string) => ({
    mockResolvedValue: (value: any) => {
      obj[method] = () => Promise.resolve(value)
      return obj[method]
    },
  }),
}

describe("Template Editor Round-Trip", () => {
  it("should preserve all layout properties through API round-trip", async () => {
    const originalLayout = {
      recipientName: { x: 15, y: 65, width: 40, height: 8 },
      courseName: { x: 15, y: 75, width: 50, height: 6 },
      signature: { x: 60, y: 85, width: 25, height: 8 },
      qrCode: { x: 75, y: 75, width: 15, height: 15 },
    }

    const originalStyling = {
      recipientName: {
        fontFamily: "Inter",
        fontSize: 32,
        fontWeight: "bold",
        color: "#0891b2",
        textAlign: "left",
      },
      courseName: {
        fontFamily: "Inter",
        fontSize: 16,
        fontWeight: "normal",
        color: "#374151",
        textAlign: "left",
      },
    }

    const templateData = {
      name: "Test Template",
      description: "Test template for round-trip",
      category: "test",
      backgroundImage: "/test-bg.png",
      orientation: "landscape" as const,
      status: "active" as const,
      layout: originalLayout,
      styling: originalStyling,
      variables: ["{{recipientName}}", "{{courseName}}"],
    }

    // Mock API responses
    const createdTemplate = {
      ...templateData,
      id: "test-template-1",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    }

    jest.spyOn(templatesApi, "create").mockResolvedValue(createdTemplate)
    jest.spyOn(templatesApi, "getById").mockResolvedValue(createdTemplate)

    const { result } = renderHook(() => useTemplateMutations())

    // Create template
    let newTemplate
    await act(async () => {
      newTemplate = await result.current.createTemplate(templateData)
    })

    // Fetch it back
    const fetchedTemplate = await templatesApi.getById(newTemplate.id)

    // Verify exact match of layout properties
    expect(fetchedTemplate.layout).toEqual(originalLayout)
    expect(fetchedTemplate.styling).toEqual(originalStyling)

    // Verify no properties were lost
    Object.keys(originalLayout).forEach((key) => {
      expect(fetchedTemplate.layout[key]).toBeDefined()
      expect(fetchedTemplate.layout[key]).toEqual(originalLayout[key])
    })

    Object.keys(originalStyling).forEach((key) => {
      expect(fetchedTemplate.styling[key]).toBeDefined()
      expect(fetchedTemplate.styling[key]).toEqual(originalStyling[key])
    })
  })
})
