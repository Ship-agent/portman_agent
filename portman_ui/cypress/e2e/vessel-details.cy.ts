describe('Vessel Details', () => {
    beforeEach(() => {
        // Login first with correct credentials
        cy.visit('/login')
        cy.dataCy('input-email').type('admin@portman.com')
        cy.dataCy('input-password').type('admin123')
        cy.dataCy('auth-submit').click()

        // Navigate to a specific vessel's details page
        // Using a known IMO number from mock data
        cy.visit('/vessel/9902419')
    })

    it('should show loading state when fetching data', () => {
        // Intercept API calls and delay response
        cy.intercept('GET', '**/vessel/*', (req) => {
            req.on('response', (res) => {
                res.delay = 2000
            })
        }).as('getVesselDetails')

        // Reload the page
        cy.visit('/vessel/9902419')

        // Check loading indicator appears
        cy.get('.MuiCircularProgress-root').should('be.visible')

        // Wait for data to load
        cy.wait('@getVesselDetails')

        // Check vessel details appear after loading
        cy.dataCy('vessel-details-title').should('be.visible')
    })

    it('should display vessel information card', () => {
        // Check vessel name and IMO
        cy.dataCy('vessel-name').should('be.visible')
        cy.dataCy('vessel-imo').should('be.visible')

        // Check status chips
        cy.dataCy('vessel-status-chip').should('be.visible')
    })

    it('should display schedule information', () => {
        // Check schedule section
        cy.dataCy('schedule-title').should('be.visible')

        // Check ETA and ETD fields
        cy.dataCy('vessel-eta').should('be.visible')
        cy.dataCy('vessel-etd').should('be.visible')
    })

    it('should display additional information', () => {
        // Check additional information section
        cy.dataCy('additional-info-title').should('be.visible')

        // Check agent and shipping company fields
        cy.dataCy('vessel-agent').should('be.visible')
        cy.dataCy('vessel-shipping-company').should('be.visible')
    })

    // it('should handle error state', () => {
    //     // Intercept API call and return error
    //     cy.intercept('GET', '**/vessel/*', {
    //         statusCode: 404,
    //         body: { message: 'Vessel not found' }
    //     }).as('vesselError')

    //     // Make API request directly
    //     cy.request({
    //         url: '/vessel/invalid-imo',
    //         failOnStatusCode: false
    //     }).then((response) => {
    //         expect(response.status).to.equal(404)
    //         expect(response.body.message).to.equal('Vessel not found')
    //     })

    //     // Visit the page to check UI error state
    //     cy.visit('/vessel/invalid-imo')
    //     cy.get('.MuiAlert-root').should('be.visible')
    //     cy.get('.MuiAlert-root').should('contain', 'Vessel not found')
    // })

    it('should format dates correctly', () => {
        // Check that dates are displayed in a readable format
        cy.dataCy('vessel-eta').parent().find('p').invoke('text').then((text) => {
            // Check if the text matches date format (flexible check)
            const hasDateFormat = /\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}|\d{1,2}:\d{2}/.test(text)
            expect(hasDateFormat || text === 'N/A').to.be.true
        })
    })
})