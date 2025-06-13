/// <reference types="cypress" />

describe("Student Workflow", () => {
  it("should complete student workflow in under 5s", () => {
    const startTime = Date.now()

    // Login as student
    cy.visit("/auth/login")
    cy.get('[data-testid="email-input"]').type("student@ims.edu.et")
    cy.get('[data-testid="password-input"]').type("student123")
    cy.get('[data-testid="login-button"]').click()

    // View certificates
    cy.url().should("include", "/dashboard")
    cy.get('[data-testid="certificate-gallery"]').should("be.visible")

    // Download certificate
    cy.get('[data-testid="certificate-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="download-pdf"]').click()
      })

    // LinkedIn share dialog
    cy.get('[data-testid="share-linkedin"]').click()
    cy.get('[data-testid="linkedin-dialog"]').should("be.visible")
    cy.get('[data-testid="close-dialog"]').click()

    // Check timing
    const endTime = Date.now()
    const duration = endTime - startTime
    expect(duration).to.be.lessThan(5000)
  })
})
