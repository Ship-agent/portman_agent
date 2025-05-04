describe('Port Call Management', () => {
    beforeEach(() => {
        // Login first with correct credentials
        cy.visit('/login')
        cy.dataCy('input-email').type('admin@portman.com')
        cy.dataCy('input-password').type('admin123')
        cy.dataCy('auth-submit').click()

        // Navigate to port call management
        cy.visit('/port-call-management')
    })

    it('should show page title and add button', () => {
        cy.dataCy('portcallmanagement-title').should('be.visible')
        cy.dataCy('add-portcall-button').should('be.visible')
    })

    it('should show search field', () => {
        cy.dataCy('portcallmanagement-search').should('be.visible')
    })

    it('should show port calls table with correct columns', () => {
        cy.dataCy('portcallmanagement-table').should('exist')
        cy.contains('th', 'Vessel Name').should('be.visible')
        cy.contains('th', 'IMO').should('be.visible')
        cy.contains('th', 'Port').should('be.visible')
        cy.contains('th', 'Berth').should('be.visible')
        cy.contains('th', 'ETA').should('be.visible')
        cy.contains('th', 'ATA').should('be.visible')
        cy.contains('th', 'ETD').should('be.visible')
        cy.contains('th', 'Status').should('be.visible')
        cy.contains('th', 'Actions').should('be.visible')
    })

    it('should open add port call dialog when clicking add button', () => {
        cy.dataCy('add-portcall-button').click()
        cy.dataCy('portcall-dialog').should('be.visible')
        cy.dataCy('portcall-dialog-title').should('contain', 'Add New Port Call')
        cy.contains('label', 'Vessel Name').should('be.visible')
        cy.contains('label', 'IMO Number').should('be.visible')
        cy.contains('label', 'Port Name').should('be.visible')
    })

    it('should show loading state when fetching data', () => {
        // Intercept API calls and delay response
        cy.intercept('GET', '**/voyages', (req) => {
            req.on('response', (res) => {
                res.delay = 2000
            })
        }).as('getPortCalls')

        // Reload the page
        cy.visit('/port-call-management')

        // Check loading indicator appears
        cy.get('.MuiCircularProgress-root').should('be.visible')

        // Wait for data to load
        cy.wait('@getPortCalls')

        // Check table appears after loading
        cy.dataCy('portcallmanagement-table').should('be.visible')
    })

    it('should filter port calls by search term', () => {
        // Get the text of the first vessel
        cy.get('tbody tr').first().find('td').first().invoke('text').then((text) => {
            // Use part of the vessel name for search
            const searchTerm = text.substring(0, 3)

            // Type the search term
            cy.dataCy('portcallmanagement-search').type(searchTerm)

            // Verify filtered results contain the search term
            cy.get('tbody tr').should('have.length.at.least', 1)
            cy.get('tbody tr').first().should('contain', searchTerm)
        })
    })

    it('should show pagination controls', () => {
        cy.get('.MuiTablePagination-root').should('exist')
        cy.get('.MuiTablePagination-selectRoot').should('exist')
        cy.get('.MuiTablePagination-displayedRows').should('exist')
    })

    it('should change rows per page', () => {
        // Get initial row count
        cy.get('tbody tr').its('length').then((initialCount) => {
            // Change rows per page to 5
            cy.get('.MuiTablePagination-select').click()
            cy.get('.MuiMenuItem-root').contains('5').click()

            // Check that rows count is now 5 or less
            cy.get('tbody tr').should('have.length.at.most', 5)
        })
    })

    it('should show edit and delete buttons for each port call', () => {
        cy.get('tbody tr').first().within(() => {
            cy.dataCy('edit-portcall-button').should('exist')
            cy.dataCy('delete-portcall-button').should('exist')
        })
    })

    it('should open edit dialog when clicking edit button', () => {
        cy.dataCy('edit-portcall-button').first().click()
        cy.dataCy('portcall-dialog').should('be.visible')
        cy.dataCy('portcall-dialog-title').should('contain', 'Edit Port Call')
        cy.dataCy('dialog-save-button').should('be.visible')
        cy.dataCy('dialog-cancel-button').should('be.visible')
    })
})
