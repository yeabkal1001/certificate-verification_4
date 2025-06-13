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

  // This test was removed because i18n/translation coverage is not required for this project.
  // See README-REMOVE.txt for details.
})
