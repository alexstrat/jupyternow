var path = require('path'),
    envdir = require('envdir'),
    rootPath = path.normalize(__dirname + '/..'),
    url = require('url'),
    env = process.env.NODE_ENV || 'development';

envdir.core.environment.load('envdir');

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'jupyterlab'
    },
    port: 3000,
    google: {
      oauth2_key: process.env.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
      oauth2_secret: process.env.SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET,
    },
    docker: {
      // null will use ENV variables
      host_config: null,
      // the IP accessible to the proxy server
      host_ip: url.parse(process.env['DOCKER_HOST']).hostname
    },
    Auth0: {
      domain: 'notebookhub.auth0.com',
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
    }
  },

  test: {
    root: rootPath,
    app: {
      name: 'jupyterlab'
    },
    port: 3000,
  },

  production: {
    root: rootPath,
    app: {
      name: 'jupyterlab'
    },
    port: 3000,
  }
};

module.exports = config[env];
