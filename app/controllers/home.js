var express = require('express'),
  router = express.Router(),
  Server = require('../models/server');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
    res.render('index', {
      title: 'Generator-Express MVC',
      user: req.user
    });
});

router.get('/dispatch', function (req, res, next) {
    var user = req.user;

    if(!req.user) {
        return res.send(401);
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
