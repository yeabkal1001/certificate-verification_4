/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
    }
  }
}

describe("RBAC Coverage", () => {
  const adminRoutes = ["/dashboard", "/certificate-generator", "/admin/users", "/admin/templates", "/admin/analytics"]

  const staffRoutes = ["/dashboard", "/certificate-generator", "/staff/certificates"]

  it("should block student access to admin routes", () => {
    cy.login("student@ims.edu.et", "student123")

    adminRoutes.forEach((route) => {
      cy.visit(route, { failOnStatusCode: false })

      // Should either redirect to login or show access denied
      cy.url().should("satisfy", (url) => {
        return url.includes("/auth/login") || url.includes("/dashboard")
      })

      // Should not show admin content
      cy.get("body").should("not.contain", "Admin Dashboard")
      cy.get("body").should("not.contain", "User Management")
      cy.get("body").should("not.contain", "System Analytics")
    })
  })

  it("should block student access to staff routes", () => {
    cy.login("student@ims.edu.et", "student123")

    staffRoutes.forEach((route) => {
      cy.visit(route, { failOnStatusCode: false })

      // Should redirect or show appropriate content
      cy.url().should("satisfy", (url) => {
        return url.includes("/auth/login") || url.includes("/dashboard")
      })
    })
  })

  it("should allow admin access to all routes", () => {
    cy.login("admin@ims.edu.et", "admin123")

    adminRoutes.forEach((route) => {
      cy.visit(route)
      cy.get("body").should("not.contain", "Access Denied")
      cy.get("body").should("not.contain", "Unauthorized")
    })
  })
})
