var raven = require('raven');
var config = require('./config');

var client = new raven.Client(config.Sentry.dsn);

var env = process.env.NODE_ENV || 'development';
if (env == 'production') {
    client.patchGlobal();
}

exports.client = client;
