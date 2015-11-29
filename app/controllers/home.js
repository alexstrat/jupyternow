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
        switch(servers.length) {
            case 1:
                var server = servers[0];
                res.redirect('/s/'+server.slug);
                break;
            case 0:
                Server.createAndStartDefaultServerForUser(user)
                    .then(function(server) {
                        res.redirect('/s/'+server.slug);
                    });
                    break;
            default:
                // FIX ME: we want to display a UI to chose server to use
                var server = servers[0];
                res.redirect('/s/'+server.slug);
        }
    });
});

