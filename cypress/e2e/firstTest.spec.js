describe('test with backend', () => {
  
  beforeEach('login to app', () => {
    cy.intercept({method: 'GET', path: 'tags'}, {fixture: 'tags.json'})// intercepting the request to the tags endpoint and returning the fixture
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

  it('intercepting and modifying request and response', () => {
    cy.contains('New Article').click()

    // cy.intercept('POST', '**/articles', (req) => {
    //   req.body.article.description = 'This is the description 2'
    // }).as('postArticles')
    cy.intercept('POST', '**/articles', (req) => {
      req.reply(res => {
        expect(res.body.article.description).to.equal('This is the description')
        res.body.article.description = 'This is the description 2'
      })
    }).as('postArticles')

    cy.get('[formcontrolname=title]').type('This is the markiyan8 title')
    cy.get('[formcontrolname=description]').type('This is the description')
    cy.get('[formcontrolname=body]').type('This is the body of the article')
    cy.contains('Publish Article').click()

    cy.wait('@postArticles').then(xhr => {
      console.log(xhr)
      expect(xhr.response.statusCode).to.equal(201)
      expect(xhr.request.body.article.body).to.equal('This is the body of the article')
      expect(xhr.response.body.article.description).to.equal('This is the description 2')
    })
  })

  it('verrify popular tags are displayed', () => {
    cy.get('.tag-list')
      .should('contain', 'cypress')
      .and('contain', 'automation')
      .and('contain', 'testing')
  })

  it('verrify global feed likes count', () => {
    cy.intercept('GET', '**/articles/feed*', {"articles":[],"articlesCount":0}).as('globalFeed')
    cy.intercept('GET', '**/articles*', {fixture: 'articles.json'})
    cy.contains('Global Feed').click()

    cy.get('app-article-list button').then(heartsCount => {
      expect(heartsCount[0]).to.contain('1')
      expect(heartsCount[1]).to.contain('2')
    })

    cy.fixture('articles').then(file => {
      const articleLink = file.articles[1].slug
      file.articles[1].favoritesCount = 6
      cy.intercept('POST', '**/articles/'+articleLink+'/favorite', file)
    })

    cy.get('app-article-list button').eq(1).click().should('contain', '6')
  })

  it.only('delete a new article in global feed', () => {
    // cy.intercept('GET', '**/articles/feed*', {"articles":[],"articlesCount":0}).as('globalFeed')
    // cy.intercept('GET', '**/articles*', {fixture: 'articles.json'})
    // cy.contains('Global Feed').click()

    // cy.get('.article-preview').first().click()
    // cy.get('.article-actions').contains('Delete Article').click()
    const userCredentials = {
      "user": {
        "email": Cypress.env('USER'),
        "password": Cypress.env('PASSWORD')
      }
    }

    cy.request('POST', 'https://conduit-api.bondaracademy.com/api/users/login', userCredentials).its('body').then(body => {
      const token = body.user.token;
      const dynamicTitle = Math.floor(Math.random() * 1000)
      const bodyRequest = {
        "article": {
          "title": "Request From API" + dynamicTitle,
          "description": "Api Testing",
          "body": "This is the body of the article",
          "tagList": ["cypress", "automation", "testing"]
        }
      }
      console.log(token)
      cy.request({
        method: 'POST',
        url: 'https://conduit-api.bondaracademy.com/api/articles/',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: bodyRequest,
      }).then(response => {
        expect(response.status).to.equal(201)
      })

      cy.contains('Global Feed').click()
      cy.get('.article-preview').contains(dynamicTitle).click()
      cy.get('.article-actions').contains('Delete Article').click()

      cy.request({
        method: 'GET',
        url: 'https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0',
        headers: {
          'Authorization': `Token ${token}`
        }
      }).its('body').then(body => {
        console.log("aaaabody", body)
        //expect(body.articles[0].title).not.to.equal('Request From API')
      })
    })
  })
})