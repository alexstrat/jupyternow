var mongoose = require('mongoose'),
    validate = require('mongoose-validator'),
    validator = validate.validatorjs,
    extend = require('extend'),
    Promise = require('bluebird'),
    Spawner = require('../spawners').DEFAULT_SPAWNER;


var SLUG_RE = /^[-a-zA-Z0-9_]+$/

var isURLOrNullValidator = validate({validator: function(value) {
  return validator.isNull(value) || validator.isURL(value);
}})

var ServerUserSchema = mongoose.Schema({
  auth0_user_id: String
})

var ServerSchema = mongoose.Schema({

  name: {
    type: String,
    minlength: 3
   },

  slug: {
    type: String,
    match: SLUG_RE,
    unique: true
  },

  spawner_reference: mongoose.Schema.Types.Mixed,

  internal_addres: {
    type: String,
    validate: isURLOrNullValidator,
  },

  users: [ServerUserSchema]

})

// add some instance methods
extend(ServerSchema.methods, {

  hasUser: function(user_id) {
    // get list of authorizized auth0 user_ids
    var auth0_user_ids = this.users.map(function(user) {
      return user.auth0_user_id
    });

    // test user_id agains the list of authorized auth0 user_ids
    var has_user = auth0_user_ids.indexOf(user_id) != -1;

    // returns a Promise
    return Promise.resolve(has_user);
  },

  start: function() {
    var self = this;

    var s = self._getSpawner();

    var server_data = {
      base_url: '/s/'+self.slug
    }

    return s
      .start(server_data)
      .then(function(start_info) {
        self.spawner_reference = start_info.reference;
        self.internal_addres = start_info.server_address;

        return self.save()
      })
  },

  stop: function (){
    var self = this;
    var s = self._getSpawner();

    return s
      .stop()
      .then(function() {
        self.spawner_reference = null;
        self.internal_addres = null;

      return self.save()
    });
  },

  _getSpawner: function() {
    if (!this.spawner_reference) {
      return new Spawner();
    } else {
      return new Spawner(this.spawner_reference);
    }
  }
});

// add some class methods
extend(ServerSchema.statics, {
  findBySlug: function(slug) {
    return this.findOne({'slug': slug}).exec()
  }
});

// define model and export
var Server = mongoose.model('Server', ServerSchema);
module.exports = Server;
