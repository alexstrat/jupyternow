/* jshint mocha: true */
var chai = require('chai');
var expect = chai.expect;
chai.use(require('chai-as-promised'));
var Promise = require('bluebird');

var  config = require('../../config/config');
require('../../config/mongoose')(config);

var Server = require('../../app/models/server.js');

describe('Server', function() {

   var server;
    beforeEach(function(){
        server = Server({
            name: 'Test server',
            slug: 'test_server'
        });
        return server.save();
    });
    afterEach(function() {
        return server.remove();
    });

  describe('#hasUser', function () {

    beforeEach(function() {
        server.users.push({auth0_user_id: 'id-foo-bar'});
        server.users.push({auth0_user_id: 'id-foo-bar-2'});
        server.users.push({auth0_user_id: 'id-foo-bar-3'});
        return server.save();
    });

    it('should resolve true when user user_id is in the list of users', function () {
      return Promise.all([
            expect(server.hasUser('id-foo-bar')).to.eventually.equal(true),
            expect(server.hasUser('id-foo-bar-2')).to.eventually.equal(true),
            expect(server.hasUser('id-foo-bar-3')).to.eventually.equal(true)
        ]);
    });
    it('should resolve False when user user_id is in the list of users', function () {
      return expect(server.hasUser('id-bar-foo')).to.eventually.equal(false);
    });
  });

  describe('#addInvitation', function (){
    beforeEach(function(){
      return server.addInvitation('toto@tata.com', {
        inviter_auth0_user_id: 'id-foo-bar',
        notebook_path: '/ta/maman'
      });
    });
    it('should correctly have pushed push an invitation in the models', function() {
      var invitation = server.invitations[0];
      expect(invitation).to.have.property('invitee_email').that.equals('toto@tata.com');
      expect(invitation).to.have.property('inviter_auth0_user_id').that.equals('id-foo-bar');
      expect(invitation).to.have.property('notebook_path').that.equals('/ta/maman');
    });
  });

  describe('#isInvited', function (){
    beforeEach(function(){
      return server.addInvitation('toto@tata.com', {
        inviter_auth0_user_id: 'id-foo-bar',
        notebook_path: '/ta/maman'
      });
    });
    it('should resolve true if email is among invitations', function() {
      expect(server.isInvited('toto@tata.com')).to.eventually.equal(true);
    });
    it('should resolve false if email is not among invitations', function() {
      expect(server.isInvited('tonton@tata.com')).to.eventually.equal(false);
    });
  });

  describe('#addAsServerUserIfInvited', function (){
    beforeEach(function(){
      return server.addInvitation('toto@tata.com', {
        inviter_auth0_user_id: 'id-foo-bar',
        notebook_path: '/ta/maman'
      });
    });
    it('should add the user if invited', function() {
      return server
        .addAsServerUserIfInvited('toto-user-id', 'toto@tata.com')
        .then(function() {
          expect(server.hasUser('toto-user-id')).to.eventually.be.true;
        });
    });
    it('should not add the user if not invitied', function() {
      return server
        .addAsServerUserIfInvited('toto2-user-id', 'toto2@tata.com')
        .then(function() {
          expect(server.hasUser('toto2-user-id')).to.eventually.be.false;
        });
    });
  });
});
