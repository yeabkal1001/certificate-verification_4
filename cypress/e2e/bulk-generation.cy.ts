/// <reference types="cypress" />

describe("Bulk Certificate Generation", () => {
  it("should complete full bulk generation workflow", () => {
    // Login as Admin
    cy.login("admin@ims.edu.et", "admin123")
    cy.visit("/certificate-generator")

    // Navigate to Bulk Upload
    cy.get('[data-testid="bulk-generation-tab"]').click()

    // Upload CSV with 5 records
    cy.get('[data-testid="csv-upload"]').selectFile("cypress/fixtures/bulk-certificates.csv")
    cy.get('[data-testid="preview-table"]').should("be.visible")
    cy.get('[data-testid="preview-row"]').should("have.length", 5)

    // Select template
    cy.get('[data-testid="template-selector"]').click()
    cy.get('[data-testid="template-modern-achievement"]').click()

    // Navigate to signing tab
    cy.get('[data-testid="signing-tab"]').click()

    // Place signature via canvas
    cy.get('[data-testid="signature-canvas"]').should("be.visible")
    cy.get('[data-testid="signature-canvas"]').trigger("mousedown", { x: 100, y: 50 })
    cy.get('[data-testid="signature-canvas"]').trigger("mousemove", { x: 200, y: 100 })
    cy.get('[data-testid="signature-canvas"]').trigger("mouseup")
    cy.get('[data-testid="save-signature"]').click()

    // Generate all certificates
    cy.get('[data-testid="generate-all-button"]').click()
    cy.get('[data-testid="generation-progress"]').should("be.visible")
    cy.get('[data-testid="generation-complete"]', { timeout: 10000 }).should("be.visible")

    // Verify 5 new certificates in list
    cy.get('[data-testid="certificates-tab"]').click()
    cy.get('[data-testid="certificate-item"]').should("have.length.at.least", 5)

    // Verify each certificate has download link and QR code
    cy.get('[data-testid="certificate-item"]').each(($el) => {
      cy.wrap($el).within(() => {
        cy.get('[data-testid="download-pdf"]').should("exist")
        cy.get('[data-testid="qr-code"]').should("exist")

        // Test PDF download contains correct elements
        cy.get('[data-testid="download-pdf"]').click()
        // Note: Actual PDF content verification would require additional tools
      })
    })
  })
})
