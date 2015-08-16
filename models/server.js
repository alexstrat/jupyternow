var JsonField = require('sequelize-json'),
    Spawner = require('../app/spawners').DEFAULT_SPAWNER;

var SLUG_RE = /^[-a-zA-Z0-9_]+$/

module.exports = function(sequelize, DataTypes) {

  var Server = sequelize.define('Server', {

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: SLUG_RE
      }
    },

    spawner_reference: JsonField(sequelize, 'Server', 'spawner_reference'),

    internal_addres: {
      type: DataTypes.STRING,
      validate: {isUrl: true}
    }

  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    },
    instanceMethods: {

      start: function() {
        var self = this;

        var s = self._getSpawner();

        return s
          .start()
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
    }
  });

  return Server;
};
