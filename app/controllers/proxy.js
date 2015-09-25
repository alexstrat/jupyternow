var express = require('express'),
   router = express.Router(),
   db = require('../../models'),
   httpProxy = require('http-proxy'),
   url = require('url');

module.exports = function (app) {
  app.use('/', router);
};


// Setup a proxy

var proxy = httpProxy.createProxyServer({ws:true});

proxy.on('error', function(err) {
    console.log(err);
})

/**
 * Do proxy a reequest given the server to proxy to
 * @param  {Request} req - request
 * @param   {Response} resp - response
 * @param  {Server} server - server to proxy to
 */
var doProxyRequest = function(req, res, server) {
    var internal_addres = server.internal_addres;

    // treat websocket
    if(req.upgradeSocket) {
        proxy.ws(req, req.upgradeSocket, {target: internal_addres});
    } else {
        proxy.web(req, res, {target: internal_addres});
    }
}


// Routing

router.all('/s/:server_slug*', function (req, res, next) {
  var slug = req.params.server_slug;
  db.Server
    .findBySlug(slug)
    .then(function(server) {
        if(!server) {
            return res.send(404);
        }

        if(!req.user) {
             return res.send(401);
        }

        server.hasUser(req.user).then(function(has_user) {
            if(has_user) {
                doProxyRequest(req, res, server)
            } else {
                return res.send(403);
            }

        });
    });
});
