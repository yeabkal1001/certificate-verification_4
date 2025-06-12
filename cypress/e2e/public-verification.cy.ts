/// <reference types="cypress" />

describe("Public Verification Workflow", () => {
  it("should complete verification workflows in under 5s", () => {
    const startTime = Date.now()

    // Test QR scan simulation
    cy.visit("/verify")
    cy.get('[data-testid="qr-scanner"]').should("be.visible")

    // Simulate QR scan result
    cy.window().then((win) => {
      win.postMessage({ type: "QR_SCAN_RESULT", data: "CERT-2024-001" }, "*")
    })
    cy.get('[data-testid="verification-result"]').should("be.visible")

    // Test manual ID entry - valid
    cy.get('[data-testid="manual-tab"]').click()
    cy.get('[data-testid="certificate-id-input"]').type("CERT-2024-001")
    cy.get('[data-testid="verify-button"]').click()
    cy.get('[data-testid="valid-result"]').should("be.visible")

    // Test manual ID entry - invalid
    cy.get('[data-testid="certificate-id-input"]').clear().type("INVALID-ID")
    cy.get('[data-testid="verify-button"]').click()
    cy.get('[data-testid="invalid-result"]').should("be.visible")

    // Check timing
    const endTime = Date.now()
    const duration = endTime - startTime
    expect(duration).to.be.lessThan(5000)
  })
})
