var raven = require('raven');
var config = require('./config');

var client = new raven.Client(config.Sentry.dsn);

client.patchGlobal();

exports.client = client;
