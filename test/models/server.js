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
});
