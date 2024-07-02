describe('test with backend', () => {
  
  beforeEach('login to app', () => {
    cy.intercept('GET', '**/tags', {fixture: 'tags.json'})// intercepting the request to the tags endpoint and returning the fixture
    cy.loginToApplication()
  })

  it('verrify correct request and response', () => {
    cy.contains('New Article').click()

    cy.intercept('POST', '**/articles').as('postArticles')

    cy.get('[formcontrolname=title]').type('This is the markiyan6 title')
    cy.get('[formcontrolname=description]').type('This is the description')
    cy.get('[formcontrolname=body]').type('This is the body of the article')
    cy.contains('Publish Article').click()

    cy.wait('@postArticles').then(xhr => {
      console.log(xhr)
      expect(xhr.response.statusCode).to.equal(201)
      expect(xhr.request.body.article.body).to.equal('This is the body of the article')
      expect(xhr.response.body.article.description).to.equal('This is the description')
    })
  })

  it.only('verrify popular tags are displayed', () => {
    cy.get('.tag-list')
      .should('contain', 'cypress')
      .and('contain', 'automation')
      .and('contain', 'testing')
  })
})