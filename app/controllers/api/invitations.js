var express = require('express'),
  router = express.Router(),
  Server = require('../../models/server'),
  bodyParser = require('body-parser'),
  mailer = require('../../mailer'),
  logging = require('winston');

module.exports = function (app) {
  app.use('/api', router);
  logging.info('invitations router mounted on /api');
};


router
    .use(bodyParser.json())
    .param('server_slug', function(req, res, next, slug) {
        Server
            .findBySlug(slug)
            .then(function(server) {
                req.server = server;
                next();
            }).catch(next);
    })
    .route('/s/:server_slug/invitations')
         .all(function(req, res, next) {
            if(!req.user)
                return res.sendStatus(401);
            if(!req.server)
                return res.sendStatus(404);

            req.server
                .hasUser(req.user.id)
                .then(function(has_user) {
                    if (!has_user) return res.sendStatus(403);
                    next();
                }).catch(next);
        })
        .post(function(req, res, next) {
            var email = req.body.email;
            var notebook = req.body.notebook;

            req.server
                .addInvitation(email, {
                    inviter_auth0_user_id: req.user.id,
                    notebook_path: notebook
                })
                .then(function(invitation) {
                    return mailer.sendInvitation(invitation);
                })
                .then(function() {
                    res.sendStatus(201);
                }).catch(next);
        });
