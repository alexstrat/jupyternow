chai = require 'chai'
expect = chai.expect
request = require 'supertest'
express = require 'express'
FakeServer = require './fake-server'
passportStub = require 'passport-stub'
config = require '../../config/config'


describe 'controllers > proxy >', ->
    fserver = db_connection = app = null
    beforeEach ->
        this.timeout(3000)
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

    describe 'access restrictions >', ->
        it 'logged/authorized : should proxy connection', ->
            passportStub.login(id: 'id-foo-bar')
            request(app)
                .get('/s/fake_server/foo-bar')
                .expect(200)

        it 'logged/non-authorized : no access (403)', ->
            passportStub.login(id: 'id-foo-bar2')
            request(app)
                .get('/s/fake_server/foo-bar')
                .expect(403)

        it 'logged/no-server : no access (404)', ->
            passportStub.login(id: 'id-foo-bar')
            request(app)
                .get('/s/fake_server_that_doesnot_exist/foo-bar')
                .expect(404)

        it 'not-logged : no access (302 redirect: login page)', ->
            request(app)
                .get('/s/fake_server/foo-bar')
                .expect('Location', '/login?redirect_to=/s/fake_server/foo-bar')
                .expect(302)

    describe 'invitations acceptions >', ->
        beforeEach ->
            return fserver.addInvitation 'toto@tata.com',
                inviter_auth0_user_id: 'id-foo-bar',
                notebook_path: '/ta/maman'

        it 'logged/invited : should proxy connection', ->
            passportStub.login(
                id: 'id-toto',
                emails: [
                    value: 'toto@tata.com'
                ])
            request(app)
                .get('/s/fake_server/foo-bar')
                .expect(200)

        it 'logged/not-invited : no access (403)', ->
            passportStub.login(
                id: 'id-toto',
                emails: [
                    value: 'tootoot@tata.com'
                ])
            request(app)
                .get('/s/fake_server/foo-bar')
                .expect(403)
