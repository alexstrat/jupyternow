var Promise = require('bluebird');
var streamToPromise = require('stream-to-promise');
var dockerUtil = require('../app/lib/docker_utils');

var config = require('../config/config');
var mongoConnection = require('../config/mongoose')(config);

var Server = require('../app/models/server');

Server.find().exec()
    .map(function(server) {
        var spa = server._getSpawner();
        return Promise.props({
            server: server,
            inpsectData: spa.getDataContainer().inspectAsync()
        });
    })
    .filter(function(s) {
        return "/home/jovyan/work" in s.inpsectData.Config.Volumes ||
               "/home/jovyan/work/" in s.inpsectData.Config.Volumes;
    })
    .then(function(servers) {
        console.log("Ok "+servers.length+ " servers to migrate");
        return servers;
    })
    .map(function(server) {
        return migrate(server.server);
    }, {concurrency: 1})
    .finally(function(){
        mongoConnection.disconnect();
    });


var migrate = function(server) {
    var spawner = server._getSpawner();
    return spawner
        .getDataContainer()
        .getArchiveAsync({path: "/home/jovyan/work/."})
        .then(streamToPromise)
        .then(function(WorkDirData) {

            return server
                .stop()
                .then(function(){return server.start();})
                .thenReturn(WorkDirData);
        })
        .then(function(WorkDirData) {
            var dataC = server._getSpawner().getAppContainer();
            // upload the data
            return dataC
                .putArchiveAsync(WorkDirData, {path: "/home/jovyan/work"})
                .thenReturn(dataC);
        })
        .then(function(dataC) {
            // ok we gotta change the ownership of what we upload
            var cmd = ['chown', '-R', 'jovyan:users', '/home/jovyan/work'];
            var opts = {User: 'root'};
            return dockerUtil.runCommandInContainer(dataC, cmd, opts);
        })
        .then(function() {
            console.log("Ok it's done");
        });
};
