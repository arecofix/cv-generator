describe('CV Generator E2E Tests', () => {
  beforeEach(() => {
    // Visit the static HTML file
    cy.visit('index.html');
  });

  it('Debe abrir el modal del perfil y permitir guardar datos', () => {
    cy.get('#openProfileBtn').click();
    cy.get('#profileModal').should('have.class', 'visible');

    // Llenar datos
    cy.get('#p_name').type('Ezequiel Enrico Areco');
    cy.get('#p_email').type('eze@test.com');
    cy.get('#p_skills').type('React, Angular, Node.js');

    // Añadir experiencia
    cy.get('button').contains('+ Añadir').first().click();
    cy.get('.exp-company').first().type('Test Company');
    cy.get('.exp-role').first().type('QA Engineer');
    cy.get('.exp-desc').first().type('Testing E2E con Cypress');

    // Guardar
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertStub');
    });
    cy.contains('Guardar Perfil').click();
    
    // Verificar que se haya guardado localmente
    cy.get('@alertStub').should('have.been.calledWith', 'Perfil guardado con éxito.');
    cy.get('#profileModal').should('not.have.class', 'visible');
  });

  it('Debe iniciar la generación del CV e interceptar el webhook', () => {
    cy.intercept('POST', 'https://n8n.arecofix.com.ar/webhook/cv-generator', {
      statusCode: 200,
      body: {
        url_pdf: 'data:application/pdf;base64,mock',
        file_name: 'Mock_CV.pdf'
      }
    }).as('generateCV');

    cy.get('#jobTitle').type('Desarrollador Frontend');
    cy.get('#jobDesc').type('Se busca desarrollador con React y Angular.');
    
    cy.get('#generateBtn').click();
    
    // Debería mostrar spinner
    cy.get('#loadingState').should('have.class', 'visible');

    // Esperar respuesta
    cy.wait('@generateCV').then((interception) => {
      const body = interception.request.body;
      // Verificar que inyecta la regla estricta de 1 hoja
      expect(body.job_description).to.include('1 hoja');
    });

    // Debería mostrar botón de descarga
    cy.get('#successState').should('have.class', 'visible');
    cy.get('#downloadBtn').should('have.attr', 'download', 'Mock_CV.pdf');
  });
});
