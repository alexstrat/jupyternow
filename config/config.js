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
      host_config: null, // will use ENV variable,
      plublic_ip: url.parse(process.env['DOCKER_HOST']).hostname
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
