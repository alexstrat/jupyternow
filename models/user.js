'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: DataTypes.STRING,
    google_uid: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      },

      /**
       * Given a Passport user profile (http://passportjs.org/docs/profile),
       * attempt to retrieve the User instance. If not, create it from profile.
       *
       * @param  {profile} passportjs user profile
       * @param  {Function} done callabck
       */
      findOrCreateFromProfile: function(profile, done) {
        var self = this;

        // check if we are not on a provider I can't handle
        if (profile.provider != 'google') {
          err = new Error("findOrCreateFromProfile: can't handle profiles that\
are not from google")

          return done(err, null);
        }

        // construct user from profile
        var user_data = {
          google_uid: profile.id,
          first_name: profile.name.givenName,
          last_name: profile.name.familyName,
          email: profile.emails[0].value,
        }

        self
        .findOrCreate({
          where: {
            google_uid: profile.id
          },
          defaults: user_data
        })
        .spread(function(user) {
          done(null, user)
        });
      }
    }
  });

  return User;
};
