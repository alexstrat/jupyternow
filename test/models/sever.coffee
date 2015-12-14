chai = require 'chai'
expect = chai.expect
chai.use require 'chai-as-promised'
Promise = require 'bluebird'
config = require '../../config/config'
Server = require '../../app/models/server.js'

describe 'Server', ->

    db_connection = null
    server = null
    beforeEach ->
        db_connection = require('../../config/mongoose') config

        server = Server(
            name: 'Test server'
            slug: 'test_server')
        server.save()
    afterEach (done) ->
        server.remove()
        db_connection.disconnect(done)

    describe '#hasUser', ->

        beforeEach ->
            server.users.push auth0_user_id: 'id-foo-bar'
            server.users.push auth0_user_id: 'id-foo-bar-2'
            server.users.push auth0_user_id: 'id-foo-bar-3'
            server.save()

        it 'should resolve true when user user_id is in the list of users', ->
            Promise.all [
                expect(server.hasUser('id-foo-bar'))
                    .to.eventually.equal(true)
                expect(server.hasUser('id-foo-bar-2'))
                    .to.eventually.equal(true)
                expect(server.hasUser('id-foo-bar-3'))
                    .to.eventually.equal(true)
            ]

        it 'should resolve False when user user_id is in the list of users', ->
            expect(server.hasUser('id-bar-foo'))
                .to.eventually.equal false

    describe '#addInvitation', ->

        beforeEach ->
            server.addInvitation 'toto@tata.com',
                inviter_auth0_user_id: 'id-foo-bar'
                notebook_path: '/ta/maman'

        it 'should correctly have pushed push an invitation in the models', ->
            invitation = server.invitations[0]
            expect(invitation)
                .to.have.property('invitee_email').that.equals 'toto@tata.com'
            expect(invitation)
                .to.have.property('inviter_auth0_user_id').that.equals 'id-foo-bar'
            expect(invitation)
                .to.have.property('notebook_path').that.equals '/ta/maman'

    describe '#isInvited', ->

        beforeEach ->
            server.addInvitation 'toto@tata.com',
                inviter_auth0_user_id: 'id-foo-bar'
                notebook_path: '/ta/maman'

        it 'should resolve true if email is among invitations', ->
            expect(server.isInvited('toto@tata.com'))
                .to.eventually.equal true

        it 'should resolve false if email is not among invitations', ->
            expect(server.isInvited('tonton@tata.com'))
                .to.eventually.equal false

    describe '#addAsServerUserIfInvited', ->

        beforeEach ->
            server.addInvitation 'toto@tata.com',
                inviter_auth0_user_id: 'id-foo-bar'
                notebook_path: '/ta/maman'

        it 'should add the user if invited', ->
            server.addAsServerUserIfInvited('toto-user-id', 'toto@tata.com').then ->
                expect(server.hasUser('toto-user-id'))
                    .to.eventually.be.true

        it 'should not add the user if not invitied', ->
            server.addAsServerUserIfInvited('toto2-user-id', 'toto2@tata.com').then ->
                expect(server.hasUser('toto2-user-id'))
                    .to.eventually.be.false
