var express = require('express'),
  router = express.Router(),
  passport = require('passport'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  session = require('express-session')
  config = require('../../config/config'),
  User = require('../../models').User;


router.get('/auth/google',
  passport.authenticate('google',{
    scope: ['https://www.googleapis.com/auth/userinfo.email']
  })
);

router.get('/complete/google-oauth2/',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(user_id, done) {
  User.findById(user_id).then(function(user) {
    done(null, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: config.google.oauth2_key,
    clientSecret: config.google.oauth2_secret,
    callbackURL: "http://test1.com:3000/complete/google-oauth2"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreateFromProfile(profile, done);
  }
));




module.exports = function (app) {
  // FIX ME: please add a real secret
  app.use(session({secret: 'foo'}));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/', router);

};
