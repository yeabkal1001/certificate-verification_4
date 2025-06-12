/// <reference types="cypress" />

describe("404 & Error Boundaries", () => {
  const invalidRoutes = [
    "/asdf",
    "/certificate/xyz",
    "/admin/nonexistent",
    "/verify/invalid-code",
    "/dashboard/fake-page",
  ]

  it("should show custom 404 page for invalid routes", () => {
    invalidRoutes.forEach((route) => {
      cy.visit(route, { failOnStatusCode: false })

      // Should show custom 404 page, not default Next.js blank screen
      cy.get("body").should("contain", "404")
      cy.get("body").should("contain", "Page Not Found")
      cy.get("body").should("not.contain", "This page could not be found")

      // Should have navigation options
      cy.get('[href="/"]').should("exist")
      cy.get('[href="/verify"]').should("exist")
    })
  })
})
