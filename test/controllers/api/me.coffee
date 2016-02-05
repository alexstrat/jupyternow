chai = require 'chai'
expect = chai.expect
sinon = require 'sinon'
chai.use require 'chai-as-promised'
chai.use require 'sinon-chai'
request = require 'supertest-as-promised'

express = require 'express'
Promise = require 'bluebird'
FakeServer = require '../fake-server'
passportStub = require 'passport-stub'
config = require '../../../config/config'
Server = require '../../../app/models/server.js'
mailer = require '../../../app/mailer'

describe 'controllers > api > me >', ->
    fserver = db_connection = app = null
    beforeEach ->
        app = express()
        require('../../../config/express')(app, config)
        passportStub.install(app)
        db_connection = require('../../../config/mongoose') config
        fserver = new FakeServer({
            name: "FakeServer",
            slug: "fake_server"
            users: [{auth0_user_id: 'id-foo-bar'}]
        })
        return fserver.start()

    afterEach ->
        passportStub.logout()
        passportStub.uninstall(app)
        return fserver.stop()
               .then ->
                    return fserver.remove()
               .then ->
                    return db_connection.disconnect()


    describe 'GET', ->
        it 'non logged: should refuse (403)', ->
            request(app)
                .get('/api/me')
                .set('Accept', 'application/json')
                .expect(401)

        it 'logged: should return ok', ->
            passportStub.login(
                id: 'id-foo-bar',
                displayName: 'Alex'
                photos: [
                    value: 'http://image-url.com'
                ])

            request(app)
                .get('/api/me')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200,
                    displayName: 'Alex',
                    photo: 'http://image-url.com'
                    servers: [
                        name: "FakeServer",
                        slug: "fake_server"
                    ]
                )
