/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
    }
  }
}

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit("/auth/login")
    cy.get('[data-testid="email-input"]').type(email)
    cy.get('[data-testid="password-input"]').type(password)
    cy.get('[data-testid="login-button"]').click()
    cy.url().should("include", "/dashboard")
  })
})
