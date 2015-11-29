var mongoose = require('mongoose'),
    validate = require('mongoose-validator'),
    validator = validate.validatorjs,
    extend = require('extend'),
    uuid = require('node-uuid'),
    Spawner = require('../spawners').DEFAULT_SPAWNER;

/**
 * Vaidation utils
 */

var SLUG_RE = /^[-a-zA-Z0-9_]+$/;

var isURLOrNullValidator = validate({validator: function(value) {
  return validator.isNull(value) || validator.isURL(value);
}});

/**
 * Model definitons: Server  and ServerUser.
 *
 * Server represents a Jupyter Notbook server. It contains:
 * - access restriction data and methods associated
 * - methods to start and stop the underlying Jupyter notebook instance
 * (controlled thru `Spawner` instance)
 *
 * ServerUser is sub-doc of Server to store users of a server.
 */
var ServerUserSchema = mongoose.Schema({
  auth0_user_id: {type: String, unique: true}
});

var ServerSchema = mongoose.Schema({

  name: {
    type: String,
    minlength: 3
   },

  // slug is used to construct the URL of the server, should be unique
  // designed to be customizable (future)
  slug: {
    type: String,
    match: SLUG_RE,
    unique: true
  },

  spawner_reference: mongoose.Schema.Types.Mixed,

  // internal_address is the address (http://host:port) on which the Jupyter
  // notebook instance is accessible on. Requests/responses will be proxified to
  // this address
  internal_addres: {
    type: String,
    validate: isURLOrNullValidator,
  },

  users: [ServerUserSchema]

});

/**
 * Instance methods
 */
extend(ServerSchema.methods, {
  /**
   * Check if the server gives acces right to the user with given `user_id`
   * @param  {String}  user_id The auth0 user id.
   * @return {Promise<Boolean>} resolve True if user has access
   */
  hasUser: function(user_id) {
    // get list of authorizized auth0 user_ids
    var auth0_user_ids = this.users.map(function(user) {
      return user.auth0_user_id;
    });

    // test user_id agains the list of authorized auth0 user_ids
    var has_user = auth0_user_ids.indexOf(user_id) != -1;

    // returns a Promise
    return Promise.resolve(has_user);
  },

  /**
   * Start the server.
   * @return {Promise<this>} Resolved if successfully started.
   */
  start: function() {
    var self = this;

    var s = self._getSpawner();

    var server_data = {
      base_url: '/s/'+self.slug
    };

    return s
      .start(server_data)
      .then(function(start_info) {
        self.spawner_reference = start_info.reference;
        self.internal_addres = start_info.server_address;

        return self.save();
      });
  },

  /**
   * Stop the server.
   * @return {Promise<this>} Resolved if successfully stopped.
   */
  stop: function (){
    var self = this;
    var s = self._getSpawner();

    return s
      .stop()
      .then(function() {
        self.spawner_reference = null;
        self.internal_addres = null;

      return self.save();
    });
  },

  /**
   * Get an instance of the spawner
   * @return {Spawner}
   * @private
   */
  _getSpawner: function() {
    if (!this.spawner_reference) {
      return new Spawner();
    } else {
      return new Spawner(this.spawner_reference);
    }
  }
});

/**
 * Class methods of Server model.
 */
extend(ServerSchema.statics, {
  /**
   * Find one server by its slug.
   * @param  {String} slug - slug name
   * @return {Promise<Server>} - if exists, resolve the instance of Server
   */
  findBySlug: function(slug) {
    return this.findOne({'slug': slug}).exec();
  },

  /**
   * Find servers by user_id (auth0_user_id).
   * Resolve an empty array if no server.
   * @param  {String} user_id Auth0 user ID
   * @return {Promise<[Server]>} Resolve array of server instances
   */
  findByUserId: function(user_id) {
    return this.find({'users.auth0_user_id': user_id}).exec();
  },

  /**
   * Create a brand new server and start it straight.
   * Resolve only after the server is successfully started.
   * @param  {String} server_name a server name
   * @param  {String} user_id     Auth0 id of a user of the new server
   * @return {Promise<Server>} Resolve the newly created and started Server
   */
  createAndStart: function(server_name, user_id) {
    var server = new this({
      name: server_name,
      slug: uuid.v4(),
    });

    server.users.push({auth0_user_id: user_id});

    return server
      .save()
      .then(function(){
        return server.start();
      });
  },

  /**
   * Create and start a new server for a given user.
   * Use name of the user to name the new server.
   * @see `createAndStart`
   * @param  {Dict} user
   * @return {Promise<Server>} Resolve the newly created and started Server
   */
  createAndStartDefaultServerForUser: function(user) {
    var server_name = user.name.givenName + '\'s default server';
    return this.createAndStart(server_name, user.id);
  }
});

// define model and export
var Server = mongoose.model('Server', ServerSchema);
module.exports = Server;
