/// <reference types="cypress" />

describe("Admin Workflow", () => {
  it("should complete full admin workflow in under 5s", () => {
    const startTime = Date.now()

    // Login as admin
    cy.visit("/auth/login")
    cy.get('[data-testid="email-input"]').type("admin@ims.edu.et")
    cy.get('[data-testid="password-input"]').type("admin123")
    cy.get('[data-testid="login-button"]').click()

    // Navigate to bulk upload
    cy.url().should("include", "/dashboard")
    cy.get('[data-testid="bulk-upload-tab"]').click()

    // Upload CSV file
    cy.get('[data-testid="csv-upload"]').selectFile("cypress/fixtures/sample-certificates.csv")
    cy.get('[data-testid="upload-preview"]').should("be.visible")

    // Select template
    cy.get('[data-testid="template-selector"]').click()
    cy.get('[data-testid="template-modern-achievement"]').click()

    // View certificate list
    cy.get('[data-testid="certificates-tab"]').click()
    cy.get('[data-testid="certificate-list"]').should("be.visible")

    // Revoke a certificate
    cy.get('[data-testid="certificate-item"]')
      .first()
      .within(() => {
        cy.get('[data-testid="revoke-button"]').click()
      })
    cy.get('[data-testid="revoke-reason"]').type("Test revocation")
    cy.get('[data-testid="confirm-revoke"]').click()

    // Check timing
    const endTime = Date.now()
    const duration = endTime - startTime
    expect(duration).to.be.lessThan(5000)
  })
})
