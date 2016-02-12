var config = require('../config/config');
require('../config/mongoose')(config);

var Server = require('../app/models/server');


Server.find().exec()
    .then(function(servers) {
        console.log("Ok, "+servers.length+" servers to restart");
        return servers;
    })
    .map(function(server) {
        console.log("restarting server: "+server.name+" ("+server.slug+")");
        return server.restart();
    }, {concurrency: 1})
    .then(function() {
       console.log("Ok, done.");
    });
