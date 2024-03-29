var express = require('express'),
   router = express.Router(),
   Server = require('../models/server'),
   httpProxy = require('http-proxy'),
   logging = require('winston');

module.exports = function (app) {
  app.use('/', router);
  logging.info('proxy router mounted on /');
};


// Setup a proxy

var proxy = httpProxy.createProxyServer({ws:true});

/**
 * Do proxy a reequest given the server to proxy to
 * @param  {Request} req - request
 * @param   {Response} resp - response
 * @param   {Next} next - next
 * @param  {Server} server - server to proxy to
 */
var doProxyRequest = function(req, res, next, server) {
    var internal_addres = server.internal_addres;

    // treat websocket
    if(req.upgradeSocket) {
        proxy.ws(req, req.upgradeSocket, {target: internal_addres}, next);
    } else {
        proxy.web(req, res, {target: internal_addres}, next);
    }
}


// Routing

router.all('/s/:server_slug*', function (req, res, next) {
  if(!req.user) {
    return res.redirect('/login?redirect_to='+req.path);
  }

  var slug = req.params.server_slug;
  Server
    .findBySlug(slug)
    .then(function(server) {
        if(!server)
            return res.sendStatus(404);

        return server
              .hasUserOrIsInvited(req.user)
              .then(function(has_user) {
                if(has_user) {
                  doProxyRequest(req, res, next, server);
                } else {
                  return res.sendStatus(403);
                }
              });
    }).catch(next);
  });
