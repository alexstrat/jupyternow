var Promise = require('bluebird');
var streamToPromise = require('stream-to-promise');
var extend = require('extend');


var is304 = function(e) {
  return e.statusCode === 304;
};

/**
 * Stop and remoe a given container,
 * if the container is not running, it does not fail and remove the container.
 * @param  {dockerode.container} container
 * @return {Promise}
 */
var killAndRemoveContainer = function(container) {
  container = Promise.promisifyAll(container);
  console.log("killing: " + container.id);
  return container
    .stopAsync()
    .catch(is304, function() { return null;})
    .then(function() {
      return container.removeAsync();
    })
    .then(function() {
      console.log("killed: " + container.id);
    });
};

exports.killAndRemoveContainer = killAndRemoveContainer;

/**
 * Kill (and remove) all the containers with the given label.
 * @param  {dockerod} docker dockerode instance
 * @param  {String} label
 * @return {Promise}
 */
exports.killAllContainersWithLabel = function(docker, label) {
  var filters = {
    label: ["app=" + label]
  };
  var listOpts = {
    all: true,
    filters: JSON.stringify(filters)
  };

  return docker
    .listContainersAsync(listOpts)
    .map(function(containerInfo) {
      return docker.getContainer(containerInfo.Id);
    })
    .each(killAndRemoveContainer);
};

/**
 * Run a given command in the container.
 * @param  {dockerode.container} container
 * @param  {String}
 * @param  {Object} [CmdOpts]
 * @return {Promise<output,inspectdata>}
 */
exports.runCommandInContainer = function(container, command, CmdOpts) {
  var options = {
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
    Cmd: command
  };

  // extend options
  if(CmdOpts && (typeof CmdOpts === "object")) {
    options = extend(options, CmdOpts);
  }

  return container
    .execAsync(options)
    .then(function(exec) {
      exec = Promise.promisifyAll(exec);
      return Promise.props({
        exec: exec,
        stream: exec.startAsync()
      });
    })
    .then(function(execCtxt) {
      execCtxt.output = streamToPromise(execCtxt.stream);
      return Promise.props(execCtxt);
    })
    .then(function(execCtxt) {
      execCtxt.inspectData = execCtxt.exec.inspectAsync();
      return Promise.props(execCtxt);
    })
    .then(function(execCtxt) {
      return [execCtxt.output, execCtxt.inspectData];
    });
};
