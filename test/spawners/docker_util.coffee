Promise = require 'bluebird'
streamToPromise = require 'stream-to-promise'

exports.killAllWithlabel = (docker, label) ->
    filters = label: ["app=#{ label }"]
    listOpts =
        all: true
        filters : JSON.stringify(filters)

    docker
        .listContainersAsync(listOpts)
        .then (containers) ->
            Promise.each containers, (containerInfo) ->
                container = docker.getContainer containerInfo.Id
                container = Promise.promisifyAll container

                is304 = (e) -> e.statusCode  == 304
                console.log "killing #{ container.id }"
                container
                    .stopAsync()
                    .catch is304, -> null
                    .then -> container.removeAsync()


exports.runCommandInContainer = (container, command) ->
    options =
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
        Cmd: command
    container
        .execAsync options
        .then (exec) ->
            exec = Promise.promisifyAll exec
            exec
                .startAsync()
                .then (stream) -> streamToPromise stream
                .then (dataBuffer) ->
                    exec
                        .inspectAsync()
                        .then (inspectData) ->
                            inspectData: inspectData,
                            outputBuffer: dataBuffer
