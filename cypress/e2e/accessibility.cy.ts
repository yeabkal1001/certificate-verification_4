/// <reference types="cypress" />

describe("Accessibility Audit", () => {
  beforeEach(() => {
    cy.injectAxe()
  })

  it("should have zero accessibility violations on login page", () => {
    cy.visit("/auth/login")
    cy.checkA11y(null, null, (violations) => {
      if (violations.length > 0) {
        throw new Error(`${violations.length} accessibility violations found`)
      }
    })
  })

  it("should have zero accessibility violations on dashboard", () => {
    cy.login("admin@ims.edu.et", "admin123")
    cy.visit("/dashboard")
    cy.checkA11y(null, null, (violations) => {
      if (violations.length > 0) {
        throw new Error(`${violations.length} accessibility violations found`)
      }
    })
  })

  it("should have zero accessibility violations on template editor", () => {
    cy.login("admin@ims.edu.et", "admin123")
    cy.visit("/certificate-generator")
    cy.get('[data-testid="template-editor-tab"]').click()
    cy.checkA11y(null, null, (violations) => {
      if (violations.length > 0) {
        throw new Error(`${violations.length} accessibility violations found`)
      }
    })
  })

  it("should have zero accessibility violations on verify page", () => {
    cy.visit("/verify")
    cy.checkA11y(null, null, (violations) => {
      if (violations.length > 0) {
        throw new Error(`${violations.length} accessibility violations found`)
      }
    })
  })
})
