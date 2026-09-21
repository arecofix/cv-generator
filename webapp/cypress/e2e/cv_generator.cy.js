describe('CV Generator End-to-End', () => {
    beforeEach(() => {
        // Intercept the n8n webhook call to mock it, or let it actually run 
        // if we are testing the real E2E flow. We will intercept it to avoid 
        // consuming Gemini API credits during automated tests, or we can just 
        // test the UI interaction.
        cy.intercept('POST', 'https://n8n.arecofix.com.ar/webhook/cv-generator', {
            statusCode: 200,
            body: { url_pdf: 'https://studio.arecofix.com.ar/test.pdf' },
            delay: 1000 // simulate network delay
        }).as('generateCV');
    });

    it('successfully fills the form and generates a CV', () => {
        // Visitar la página usando la ruta de archivo local
        cy.visit('index.html');

        // Llenar el formulario
        cy.get('#jobTitle').type('Full-Stack Developer SSR');
        cy.get('#jobDescription').type('Requisitos: Experiencia en React, Node.js, y Supabase. Uso de Cypress para testing E2E.');

        // Enviar formulario
        cy.get('#submitBtn').click();

        // Verificar el estado de carga
        cy.get('#submitBtn').should('be.disabled');
        cy.get('#loadingState').should('not.have.class', 'hidden');
        cy.get('#cvForm').should('have.class', 'hidden');

        // Esperar la respuesta
        cy.wait('@generateCV');

        // Verificar resultado exitoso
        cy.get('#resultState').should('not.have.class', 'hidden');
        cy.get('#loadingState').should('have.class', 'hidden');
        cy.get('#downloadLink')
            .should('have.attr', 'href', 'https://studio.arecofix.com.ar/test.pdf')
            .and('be.visible');
    });

    it('shows error state if the webhook fails', () => {
        cy.intercept('POST', 'https://n8n.arecofix.com.ar/webhook/cv-generator', {
            statusCode: 500,
            body: { error: 'Internal Server Error' }
        }).as('generateCVError');

        cy.visit('index.html');
        cy.get('#jobTitle').type('DevOps Engineer');
        cy.get('#jobDescription').type('AWS, Docker, CI/CD');
        cy.get('#submitBtn').click();

        cy.wait('@generateCVError');

        cy.get('#errorState').should('not.have.class', 'hidden');
        cy.get('#loadingState').should('have.class', 'hidden');
        cy.get('#errorMsg').should('contain', 'Error en la respuesta del servidor');
        cy.get('#cvForm').should('not.have.class', 'hidden');
    });
});
