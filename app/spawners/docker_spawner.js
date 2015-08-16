var Docker = require('dockerode'),
    Promise = require('bluebird').Promise,
    config = require('../../config/config.js');

var IMAGE_NAME = 'jupyter/minimal';
var EXPOSED_PORT = '8888';


function DockerSpawner(reference) {

  //instantiate a docker client
  var docker = Docker(config.docker.host_config);

  // wrap all methods of the client to return promises
  this.docker = Promise.promisifyAll(docker);
}

DockerSpawner.prototype.start = function(server_data) {
  var self = this;
  var docker = self.docker;

  container_config = {
    Image: IMAGE_NAME,
    HostConfig: {
      PublishAllPorts: true
    }
  }

  return docker
    .createContainerAsync(container_config)
    .then(function(container) {
      // promisifyAllfy the container
      container = Promise.promisifyAll(container);

      // store the reeference now
      self.reference = {'container_id': container.id};

      // start the container
      return container.startAsync()

    }).then(function() {
      // inspect the container after start to have info on port
      return self.getContainer().inspectAsync();

    }).then(function(inspect_data){

      // let's extract the port from inspect data
      var NetworkSettings = inspect_data.NetworkSettings;
      self.port = NetworkSettings.Ports[EXPOSED_PORT+'/tcp'][0].HostPort;

      return self.reference
    })
}

DockerSpawner.prototype.stop = function() {
  var container = this.getContainer();
  return container.stopAsync()
          .then(function (){
            return container.removeAsync()
          })
}


DockerSpawner.prototype.getContainer = function() {
  var docker = this.docker;
  var containerId = this.reference.container_id;

  var container = docker.getContainer(containerId);

  return Promise.promisifyAll(container);
}

DockerSpawner.prototype.getStatus = function() {

}

DockerSpawner.prototype.getReference = function() {
  return this.reference;
}

DockerSpawner.prototype.getServerAddress = function() {
  var ip = config.docker.plublic_ip;
  return 'http://'+ip+':'+this.port
}

module.exports = DockerSpawner;
