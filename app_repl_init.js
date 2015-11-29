var express = require('express');
var config = require('./config/config');

var app = express();

require('./config/express')(app, config);
console.log('Express application configured and loaded in variable `app`');

require('./config/mongoose')(config);
console.log('Mongoose configured');

var Server = require('./app/models/server.js');
console.log('Server model loaded in variable `Server`');
