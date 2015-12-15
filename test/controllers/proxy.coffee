chai = require 'chai'
expect = chai.expect
request = require 'supertest'
express = require 'express'
FakeServer = require './fake-server'
passportStub = require 'passport-stub'
config = require '../../config/config'


describe 'Proxy', ->
    fserver = db_connection = app = null
    beforeEach ->
        app = express()
        require('../../config/express')(app, config)
        passportStub.install(app)
        db_connection = require('../../config/mongoose') config
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

    describe 'handle server access restrictions', ->
        it 'should proxy connection for authorized users', ->
            passportStub.login(id: 'id-foo-bar')
            request(app)
                .get('/s/fake_server/foo-bar')
                .expect(200)

        it 'should proxy connection for authorized users', ->
            passportStub.login(id: 'id-foo-bar2')
            request(app)
                .get('/s/fake_server/foo-bar')
                .expect(403)


        it 'should 404 an existant server', ->
            request(app)
                .get('/s/fake_server_that_doesnot_exist/foo-bar')
                .expect(404)

        it 'should 401 a non logged-id user', ->
            request(app)
                .get('/s/fake_server/foo-bar')
                .expect(401)
