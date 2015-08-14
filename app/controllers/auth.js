var express = require('express'),
  router = express.Router(),
  passport = require('passport'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  session = require('express-session')
  config = require('../../config/config'),
  User = require('../../models').User;


// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
router.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'] }),
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
  });

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/complete/google-oauth2/',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    console.log(req.user)
    res.redirect('/');
  });

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
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
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(session({secret: 'foo'}));
  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/', router);

};
