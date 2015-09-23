var express = require('express'),
  router = express.Router(),
   db = require('../../models'),
   httpProxy = require('http-proxy'),
   url = require('url');

module.exports = function (app) {
  app.use('/', router);
};


var proxy = httpProxy.createProxyServer({ws:true});

proxy.on('error', function(err) {
    console.log(err);
})

router.all('/s/:server_slug*', function (req, res, next) {
  var slug = req.params.server_slug;
  db.Server.findBySlug(slug).then(function(server) {
    if(!server) {
        return res.send(404);
    }

    if(req.upgradeSocket) {
        proxy.ws(req, req.upgradeSocket, {target: server.internal_addres});
    } else {
        proxy.web(req, res, {target: server.internal_addres});
    }
  })
});
