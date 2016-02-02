var path = require('path'),
    envdir = require('envdir'),
    rootPath = path.normalize(__dirname + '/..'),
    url = require('url'),
    env = process.env.NODE_ENV || 'development';

envdir.core.environment.load('envdir');

// config
var cf = {
  development: {},
  test: {},
  production: {}
};

// **************
// Express config

cf.development.root = cf.test.root = cf.production.root = rootPath;

cf.development.app = {
  name: 'jupyternow',
  host: 'test1.com:3000'
};

cf.production.app = {
  name: 'jupyternow',
  host: 'app.jupyternow.co'
};
cf.test.app = {
  name: 'jupyternow',
  host: 'app.test.com'
};

cf.development.port = cf.test.port = cf.production.port = 3000;

cf.development.session_secret = cf.test.session_secret = 'foo';
cf.production.session_secret = process.env.SESSION_SECRET;

// **************
// Docker config

cf.development.docker = {
  // in developpent we use boot2docker-compatible config, that will use env variables
  // for docker config
  host_config: null,

  // will publish the jupyter container ports on host
  networking_strategy: 'publish',
  // the IP adress of the host machine accessible to proxy server
  public_host_ip: url.parse(process.env.DOCKER_HOST).hostname
};

// test = dev, it'll be just fine for now
cf.test.docker = cf.development.docker;

cf.production.docker = {
  // for production, we'll use host's docker socket shared as a volume
  host_config: {socketPath: '/docker.sock'},
  // see docker_spawner.js: we use diretly the IP of te container
  networking_strategy: 'private'
};

// used to label containers
cf.development.docker.app_label = 'jupyternow_dev';
cf.test.docker.app_label = 'jupyternow_test';
cf.production.docker.app_label = 'jupyternow';


// **************
// MongoDB config

cf.development.mongodb = cf.test.mongodb = cf.production.mongodb = {};

cf.development.mongodb = {url: 'mongodb://localhost/jupyternow'};
cf.test.mongodb = {url: 'mongodb://localhost/jupyternow-test'};
// for prodcution, mongolab creds are stored in env variable
cf.production.mongodb = {url: process.env.MONGODB_URL};


// **************
// Redis config

//production only

var reidsPort = process.env.REDIS_PORT || 'tcp://bullshit:7398';
var redisUrl = url.parse(reidsPort);
cf.production.redis = {
  url: 'redis://'+redisUrl.hostname+':'+redisUrl.port,
  pass: process.env.REDIS_PASS || 'foo'
};


// **************
// Auth0 config

var Auth0ClientCreds = JSON.parse(process.env.AUTH0_CLIENT_CREDS);

cf.development.Auth0 = cf.production.Auth0 = {
  domain: Auth0ClientCreds.domain,
  clientID: Auth0ClientCreds.id,
  clientSecret: Auth0ClientCreds.secret
};

// bullshit for test
cf.test.Auth0 = {domain: 'bullshit.it', clientID: 'xxx', clientSecret: 'xxx'};


// **************
// SendWithUs config
cf.production.SendWithUs = {ApiKey: process.env.SENDWITHUS_API_KEY};
cf.development.SendWithUs = {ApiKey: process.env.SENDWITHUS_API_KEY};
cf.test.SendWithUs = {ApiKey: process.env.SENDWITHUS_API_KEY};

// **************
// Sentry config
cf.production.Sentry = {dsn: process.env.SENTRY_DSN};
cf.development.Sentry = {dsn: false};
cf.test.Sentry = {dsn: false};


module.exports = cf[env];
