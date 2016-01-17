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


describe 'controllers > api > invitations >', ->

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

    describe 'POST >', ->
        notebook =
            name: "Foo",
            path: "notebooks/Foo.ipynb"

        beforeEach ->
            sinon
                .stub mailer, 'sendInvitation', ->
                    return Promise.resolve()
        afterEach ->
            mailer.sendInvitation.restore()


        it 'logged/unauthorized: should refuse (403)', ->
            passportStub.login(id: 'id-foo-bar2', fullName: 'Alex')
            request(app)
                .post('/api/s/fake_server/invitations')
                .send({ email: 'invitee@tata.com', notebook: notebook})
                .expect(403)

        it 'non-logged : should refuse (403)', ->
            passportStub.login(id: 'id-foo-bar2', fullName: 'Alex')
            request(app)
                .post('/api/s/fake_server/invitations')
                .send({ email: 'invitee@tata.com', notebook: notebook})
                .expect(403)

        it 'logged/no-server : should refuse (404)', ->
            passportStub.login(id: 'id-foo-bar', fullName: 'Alex')
            request(app)
                .post('/api/s/fake_server_that_doesnot_exist/invitations')
                .send({ email: 'invitee@tata.com', notebook: notebook})
                .expect(404)

        it 'logged/authorized: should create the invitation', ->
            passportStub.login(id: 'id-foo-bar', fullName: 'Alex')
            request(app)
                .post('/api/s/fake_server/invitations')
                .send({ email: 'invitee@tata.com', notebook: notebook})
                .expect(201)
                .then ->
                    expect(mailer.sendInvitation).have.been.calledOnce
                    invited = Server.findBySlug("fake_server")
                                    .call('isInvited', ['invitee@tata.com'])
                    expect(invited)
                        .to.eventually.equal(true)

