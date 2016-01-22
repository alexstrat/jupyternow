var Docker = require('dockerode'),
    config = require('../../config/config.js'),
    Promise = require('bluebird'),
    rp = require('request-promise'),
    rp_errors = require('request-promise/lib/errors'),
    logging = require('winston'),
    poll = require('../lib/poll');

var IMAGE_NAME = 'alexstrat/jupyternow-notebook';
var EXPOSED_PORT = '8888';


function DockerSpawner(reference) {

  //instantiate a docker client
  var docker = Docker(config.docker.host_config);

  // wrap all methods of the client to return promises
  this.docker = Promise.promisifyAll(docker);

  this.reference = reference;
}

DockerSpawner.prototype.isUp = function() {
  var self = this;

  return rp({
      'method': 'GET',
      'uri': self.getServerAddress(),
       timeout: 200
  })
  .catch(rp_errors.StatusCodeError, function(){return null;})
  .then(
    function(){return true;},
    function(){ return false;}
  ).then(function(up) {
    logging.info('Docker container %j is up:'+up, self.getReference());
    return up;
  });
};

DockerSpawner.prototype.start = function(server_data) {
  logging.profile('DockerSpawner#start');

  var self = this;
  var docker = self.docker;

  var base_url = server_data.base_url;
  var container_config = {
    Image: IMAGE_NAME,
    Cmd: ['start-notebook.sh',
          '--NotebookApp.base_url='+base_url],
    Labels: {
      app: config.docker.app_label
    }
  };

  if(config.docker.networking_strategy === 'publish') {
    container_config.HostConfig = {
        PublishAllPorts: true
    };
  }

  logging.info('Create a docker container for %j', server_data);
  return docker
    .createContainerAsync(container_config)
    .then(function(container) {
      // promisifyAllfy the container
      container = Promise.promisifyAll(container);

      // store the reeference now
      self.reference = {'container_id': container.id};

      logging.info('Start the docker container %s', container.id);

      // start the container
      return container.startAsync();

    }).then(function() {
      // inspect the container after start to have info on port
      return self.getContainer().inspectAsync();

    }).then(function(inspect_data){
      // let's extract the published_port from inspect data
      var NetworkSettings = inspect_data.NetworkSettings;
      if(config.docker.networking_strategy === 'publish') {
        self._published_port = NetworkSettings.Ports[EXPOSED_PORT+'/tcp'][0].HostPort;
      } else {
        self._published_port = null;
      }
      self._container_ip = NetworkSettings.IPAddress;

      logging.info('Docker container %s inspected',  self.getReference());
    })
    .then(function() {
      return poll(self.isUp.bind(self));
    }).then(function() {
      logging.info('Docker container %s up and ready to be used', self.getReference());
      logging.profile('DockerSpawner#start');
      return {
        reference: self.getReference(),
        server_address: self.getServerAddress()
      };
    });
};

DockerSpawner.prototype.stop = function() {
  var container = this.getContainer();
  return container.stopAsync()
          .then(function (){
            return container.removeAsync();
          });
};


DockerSpawner.prototype.getContainer = function() {
  var docker = this.docker;
  var containerId = this.reference.container_id;

  var container = docker.getContainer(containerId);

  return Promise.promisifyAll(container);
};

DockerSpawner.prototype.getStatus = function() {

};

DockerSpawner.prototype.getReference = function() {
  return this.reference;
};

DockerSpawner.prototype.getServerAddress = function() {
  var net_strat = config.docker.networking_strategy;
  var ip, port;

  switch(net_strat){
    case 'publish':
      ip = config.docker.public_host_ip;
      port = this._published_port;
      break;
    case 'private':
      ip = this._container_ip;
      port = EXPOSED_PORT;
      break;
    default:
      throw Error('Unknown docker network strategy "'+net_strat+'"');
  }

  return 'http://'+ip+':'+port;
};

module.exports = DockerSpawner;
