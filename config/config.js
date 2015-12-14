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
    docker: {
      // null will use ENV variables
      host_config: null,
      // the IP accessible to the proxy server
      host_ip: url.parse(process.env.DOCKER_HOST).hostname,

      // will set the `app` label
      app_label: 'jupyterlab_dev'
    },
    Auth0: {
      domain: 'notebookhub.auth0.com',
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
    },
    mongodb: {
      url: process.env.MONGODB_URL
    }
  },

  test: {
    root: rootPath,
    app: {
      name: 'jupyterlab'
    },
    Auth0: {
      domain: 'notebookhub.auth0.com',
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
    },
    port: 3000,
    mongodb: {
      url: 'mongodb://localhost/jupyterlab-test'
    }
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
