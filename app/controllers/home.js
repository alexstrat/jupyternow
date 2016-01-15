var express = require('express'),
  router = express.Router(),
  Server = require('../models/server'),
  logging = require('winston');

module.exports = function (app) {
  app.use('/', router);
  logging.info('home router mounted on /');
};

router.get('/login', function (req, res, next) {
    var redirect_to = req.query.redirect_to;
    res.expose({
        Context: {redirect_to: redirect_to}
    });

    res.render('login', {
      title: 'Jupyternow '
    });
});

router.get('/', function (req, res, next) {
    var user = req.user;

    if(!req.user) {
        return res.redirect('/login');
    }

    Server.findByUserId(user.id).then(function(servers){
        if (servers.length === 0) {
            return Server.createAndStartDefaultServerForUser(user);
        } else {
            // FIX ME: we want to display a UI to chose server to use
            return servers[0];
        }
    }).then(function(server) {
        res.redirect('/s/'+server.slug);
    })
    .catch(next);
});
