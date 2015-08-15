var Docker = require('dockerode'),
    Promise = require('bluebird').Promise,
    config = require('../../config/config.js');

var IMAGE_NAME = 'jupyter/minimal';
var EXPOSED_PORT = '8888';


function DockerSpawner(reference) {
  this.docker = Docker(config.docker);
}

DockerSpawner.prototype.start = function(server_data, done) {
  var self = this;
  var docker = self.docker;

  container_config = {
    Image: IMAGE_NAME,
    HostConfig: {PublishAllPorts: true}
  }

  docker.createContainer(container_config, function (err, container) {
    if (err) {
      return done(err)
    }


    self.reference = {'container_id': container.id};

    container.inspect(function(err, data) {
      self.port = data.NetworkSettings.Ports[EXPOSED_PORT+'/tcp'][0].HostPort;
    })

    container.start(function (err, data) {
      if (err) {
        return done(err);
      }
      done()
    });
  });
}

DockerSpawner.prototype.stop = function(cb) {
  this.getContainer().stop(cb)
}


DockerSpawner.prototype.getContainer = function() {
  var docker = this.docker;
  var containerId = this.reference.container_id;

  return docker.getContainer(containerId);
}

DockerSpawner.prototype.getStatus = function() {

}

DockerSpawner.prototype.getReference = function() {

}

DockerSpawner.prototype.getServerAddress = function() {

}

module.exports = DockerSpawner;
