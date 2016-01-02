var Docker = require('dockerode'),
    config = require('../../config/config.js'),
    Promise = require('bluebird');

var IMAGE_NAME = 'jupyter/minimal-notebook';
var EXPOSED_PORT = '8888';


function DockerSpawner(reference) {

  //instantiate a docker client
  var docker = Docker(config.docker.host_config);

  // wrap all methods of the client to return promises
  this.docker = Promise.promisifyAll(docker);

  this.reference = reference;
}

DockerSpawner.prototype.start = function(server_data) {
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

  if(config.networking_strategy === 'publish') {
    container_config.HostConfig = {
        PublishAllPorts: true
    };
  }

  return docker
    .createContainerAsync(container_config)
    .then(function(container) {
      // promisifyAllfy the container
      container = Promise.promisifyAll(container);

      // store the reeference now
      self.reference = {'container_id': container.id};

      // start the container
      return container.startAsync();

    }).then(function() {
      // inspect the container after start to have info on port
      return self.getContainer().inspectAsync();

    }).then(function(inspect_data){

      // let's extract the published_port from inspect data
      var NetworkSettings = inspect_data.NetworkSettings;
      self._published_port = NetworkSettings.Ports[EXPOSED_PORT+'/tcp'][0].HostPort;
      self._container_ip = NetworkSettings.IPAddress;

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
  var net_strat = config.networking_strategy;
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
