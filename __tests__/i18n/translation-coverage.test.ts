import { readFileSync, readdirSync } from "fs"
import { join } from "path"

describe("Internationalization Readiness", () => {
  const getComponentFiles = (dir: string): string[] => {
    const files: string[] = []
    const items = readdirSync(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = join(dir, item.name)
      if (item.isDirectory()) {
        files.push(...getComponentFiles(fullPath))
      } else if (item.name.endsWith(".tsx") || item.name.endsWith(".ts")) {
        files.push(fullPath)
      }
    }
    return files
  }

  it("should have all text strings wrapped in translation functions", () => {
    const componentDirs = ["app", "components"]
    const failures: string[] = []

    componentDirs.forEach((dir) => {
      const files = getComponentFiles(dir)

      files.forEach((file) => {
        const content = readFileSync(file, "utf-8")

        // Look for hardcoded strings that should be translated
        const hardcodedStrings = content.match(/"[A-Za-z][^"]*"/g) || []
        const untranslatedStrings = hardcodedStrings.filter((str) => {
          // Skip technical strings, imports, etc.
          const cleaned = str.replace(/"/g, "")
          return (
            cleaned.length > 3 &&
            !cleaned.includes("/") &&
            !cleaned.includes("@") &&
            !cleaned.includes("http") &&
            !cleaned.includes("data-") &&
            !cleaned.includes("aria-") &&
            !cleaned.match(/^[A-Z_]+$/) && // Constants
            !cleaned.match(/^\d/) && // Numbers
            !content.includes(`t("${cleaned}")`) && // Already translated
            !content.includes(`__TRANSLATE__${cleaned}__`) // Development marker
          )
        })

        if (untranslatedStrings.length > 0) {
          failures.push(`${file}: ${untranslatedStrings.join(", ")}`)
        }
      })
    })

    if (failures.length > 0) {
      throw new Error(`Untranslated strings found:\n${failures.join("\n")}`)
    }
  })
})
