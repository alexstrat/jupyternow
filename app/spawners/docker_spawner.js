var Docker = require('dockerode'),
    config = require('../../config/config.js'),
    Promise = require('bluebird'),
    rp = require('request-promise'),
    rp_errors = require('request-promise/lib/errors'),
    logging = require('winston'),
    archiver = require('archiver'),
    poll = require('../lib/poll');

function DockerSpawner(reference) {

  //instantiate a docker client
  var docker = Docker(config.docker.host_config);

  // wrap all methods of the client to return promises
  this.docker = Promise.promisifyAll(docker);

  this.reference = reference || {};
}

// some constants
DockerSpawner.prototype.IMAGE_NAME = 'alexstrat/jupyternow-notebook';
DockerSpawner.prototype.EXPOSED_PORT = '8888';
DockerSpawner.prototype.UP_TIMEOUT = 20000;

/**
 * Create a data and run and app container.
 * @param  {Object} server_data
 * @param  {String} server_data.base_url - the base of URL of jupyter intance
 * @return {Promise<Object>} resolve object with reference and server_address
 */
DockerSpawner.prototype.spawn = function(server_data) {
  var self = this;
  return self
    .createDataContainer()
    .then(function(){
      return self.runAppContainer(server_data);
    })
    .then(function() {
      return {
        reference: self.reference,
        server_address: self.address
      };
    });
};

/**
 * Restart an app container: reuse the same data container, but actually
 * spanw a new app container.
 * /!\ reference and address will change
 * @param  {Object} server_data
 * @param  {String} server_data.base_url - the base of URL of jupyter intance
 * @return {Promise<Object>} resolve object with reference and server_address
 */
DockerSpawner.prototype.restart = function(server_data) {
  var self = this;
  return self
    .stopAppContainer()
    .then(function() {
      return self.runAppContainer(server_data);
    })
    .then(function () {
      return {
        reference: self.reference,
        server_address: self.address
      };
    })
};

/**
 * Create and start (=run) the app container.
 * @param  {Object} server_data
 * @param  {String} server_data.base_url - the base of URL of jupyter intance
 * @return {Promise}] resolved when running
 */
DockerSpawner.prototype.runAppContainer = function(server_data) {
  var self = this;
  var docker = self.docker;

  var dataContainerRef = self.reference.data_container;
  var base_url = server_data.base_url;

  if(!dataContainerRef.id)
    return Promise.reject(new Error("no dataContainerRef.id"));

  var appContainerConfig = {
    Image: this.IMAGE_NAME,
    Cmd: ['start-notebook.sh',
          '--NotebookApp.base_url='+base_url],
    Labels: {
      app: config.docker.app_label,
      app_role: 'app_container'
    },
    HostConfig: {
      VolumesFrom: [dataContainerRef.id]
    }
  };

  if(config.docker.networking_strategy === 'publish') {
    appContainerConfig.HostConfig.PublishAllPorts = true;
  }

  return docker
    .createContainerAsync(appContainerConfig)
    .then(function(container) {
      // promisifyAllfy the container
      container = Promise.promisifyAll(container);

      // store the reeference now
      self.reference.app_container = {
        id: container.id
      };

      // start the container
      return container.startAsync();

    }).then(function(){
      return self.getAppContainerAccessibleAddress();
    })
    .then(function(address) {
      self.address = address;
      return poll(self.isUp.bind(self), self.UP_TIMEOUT);
    });
};

/**
 * Stop the app container.
 * @return {Promise} resolved when stoppped
 */
DockerSpawner.prototype.stopAppContainer = function() {
  var container = this.getAppContainer();
  var self = this;
  // 304 on stop means the container is already stoped
  var is304 = function(e) {
    return e.statusCode  == 304;
  };
  return container
    .stopAsync()
    .catch(is304, function() {return null;})
    .then(function() {
      self.reference.app_container = null;
      self.address = null;
    });
};

/**
 * Check if the app container is running by (HTTP) pinging the server URL.
 * @return {Promise<Boolean>} resolve true if is running
 */
DockerSpawner.prototype.isUp = function() {
  var self = this;

  if(!self.address)
    throw new Error("No address");

  return rp({
      'method': 'GET',
      'uri': self.address,
       timeout: 200
  })
  .catch(rp_errors.StatusCodeError, function(){return null;})
  .then(
    function(){return true;},
    function(){ return false;}
  ).then(function(up) {
    logging.info('Docker container %j is up:'+up, self.reference);
    return up;
  });
};

/**
 * Get the accessible server address of the app continer.
 * @return {Promose<String>} Resolve te address
 */
DockerSpawner.prototype.getAppContainerAccessibleAddress = function() {
  var self = this;

  var appContainer = this.getAppContainer();
  return appContainer
    .inspectAsync()
    .then(function(inspect_data){
      var NetworkSettings = inspect_data.NetworkSettings;
      var net_strat = config.docker.networking_strategy;
      var ip, port;

      switch(net_strat){
        case 'publish':
          ip = config.docker.public_host_ip;
          port = NetworkSettings.Ports[self.EXPOSED_PORT+'/tcp'][0].HostPort;
          break;
        case 'private':
          ip = NetworkSettings.IPAddress;
          port = self.EXPOSED_PORT;
          break;
        default:
          throw Error('Unknown docker network strategy "'+net_strat+'"');
      }
      return 'http://'+ip+':'+port;
    });
};

/**
 * Create a data container and store its reference in
 * this.reference.data_container
 * @return {Promise}
 */
DockerSpawner.prototype.createDataContainer = function() {
  var docker = this.docker;
  var self = this;


  var dataContainerConfig = {
    Image: this.IMAGE_NAME,
    Cmd: '/bin/true',
    Volumes: {
        '/home/jovyan/work': {}
      },
    Labels: {
      app: config.docker.app_label,
      app_role: 'data_container'
    }
  };

  return docker
    .createContainerAsync(dataContainerConfig)
    .then(function(container) {
      self.reference.data_container = {
        id: container.id
      };
    });
};

/**
 * Ensure that we have  data container in refereence and that it exists.
 * Otherwise create a data container.
 * @return {Promise} resolved only once there is a data container
 */
DockerSpawner.prototype.ensureDataContainer = function() {
  var dataContainer = this.getDataContainer();
  var self = this;
  if(!dataContainer)
    return this.createDataContainer();

  var containerNotExist = function(e) {
    return e.reason == 'no such container';
  };

  dataContainer
    .inspectAsync()
    .thenReturn(true)
    .catch(containerNotExist, function() {return false;})
    .then(function(exist) {
      if(exist)
        return Promise.resolve();
      else
        return self.createDataContainer();
    });
};

DockerSpawner.prototype.stop = function() {
  var container = this.getContainer();
  return container.stopAsync()
          .then(function (){
            return container.removeAsync();
          });
};

/**
 * Put a file in working directory.
 * @param  {String} fileNam - name of file
 * @param  {String} data - file content
 * @return {Promise} resolved when done
 */
DockerSpawner.prototype.putFileInWorkingDir = function(fileName, data) {
  var archive = archiver.create('tar');
  archive.append(data, {name: fileName}).finalize();

  var container = this.getDataContainer();
  return container.putArchiveAsync(archive, {path: '/home/jovyan/work'});
};

/**
 * Get the app container from the refence.
 * If no reference return null.
 * @return {dockerode.Container}
 */
DockerSpawner.prototype.getAppContainer = function() {
  return this._getContainer('app_container');
};

/**
 * Get the data container from the refence.
 * If no reference return null.
 * @return {dockerode.Container}
 */
DockerSpawner.prototype.getDataContainer = function() {
  return this._getContainer('data_container');
};

/**
 * Get the container given the reference key.
 * If no reference return null.
 * @private
 * @param  {String} refKey
 * @return {dockerode.Container}
 */
DockerSpawner.prototype._getContainer = function(refKey) {
  var docker = this.docker;
  var containerRef = this.reference[refKey];

  if (!containerRef) return null;

  var container = docker.getContainer(containerRef.id);
  // promisify all method
  return Promise.promisifyAll(container);
};

DockerSpawner.prototype.getReference = function() {
  return this.reference;
};

module.exports = DockerSpawner;
