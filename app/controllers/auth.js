var passport = require('passport'),
    Auth0Strategy = require('passport-auth0'),
    config = require('../../config/config'),
    express = require('express'),
    session = require('express-session'),
    logging = require('winston');

var strategy = new Auth0Strategy({
    domain:       config.Auth0.domain,
    clientID:     config.Auth0.clientID,
    clientSecret: config.Auth0.clientSecret,
    callbackURL:  '/callback'
  }, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  });

passport.use(strategy);

// This is not a best practice, but we want to keep things simple for now
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

var router = express.Router();

// Auth0 callback handler
router.get('/callback',
  passport.authenticate('auth0', { failureRedirect: '/url-if-something-fails' }),
  function(req, res) {
    if (!req.user) {
      throw new Error('user null');
    }
    var redirect_to = req.query.redirect_to || '/';
    res.redirect(redirect_to);
  });

module.exports = function(app) {

  // express session configuration
  var sess = {
    secret: config.session_secret
  };
  if(app.get('env') === 'production') {
    var RedisStore = require('connect-redis')(session);
    sess.store = new RedisStore({
      url: config.redis.url,
      pass: config.redis.pass
    });
  }
  app.use(session(sess));

  app.use(function (req, res, next) {
    if (!req.session) {
      return next(new Error('Session unavailbale'));
    }
    next();
  });

  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/', router);
  logging.info('auth router mounted on /');

  app.locals.Auth0 = {
    clientID: config.Auth0.clientID
  };
  app.expose(config.Auth0.clientID, 'Auth0.clientID');
  app.expose(config.Auth0.domain, 'Auth0.domain');
};
