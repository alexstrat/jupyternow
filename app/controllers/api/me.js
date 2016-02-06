var express = require('express'),
  router = express.Router(),
  bodyParser = require('body-parser'),
  Server = require('../../models/server'),
  logging = require('winston');

module.exports = function (app) {
  app.use('/api', router);
  logging.info('me router mounted on /api');
};


router
    .use(bodyParser.json())
    .route('/me')
        .all(function(req, res, next) {
            if(!req.user)
                return res.sendStatus(401);
            next();
        })
        .get(function(req, res, next) {
            var data = {
                displayName: req.user.displayName,
                photo: req.user.picture
            };
            Server
                .findByUserId(req.user.id)
                .then(function(servers) {
                    data.servers = servers.map(function(s){
                        return {
                            name: s.name,
                            slug: s.slug
                        };
                    });
                    res.json(data);
                })
                .catch(next);
        });
