var JsonField = require('sequelize-json')

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
    }
  });

  return Server;
};
