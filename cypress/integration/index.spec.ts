/// <reference types="cypress" />

describe('Home Page', () => {

    beforeEach(() => {
        cy.visit('http://localhost:3000')
    })

    it("Check Ttitle Name", () => {
        cy.contains('Socket Canvas');
    })

    it("Check Creater Github", () => {
        cy.contains('By Tanishq Singh').click();
    })

})