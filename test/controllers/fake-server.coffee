Promise = require 'bluebird'
Server = require '../../app/models/server.js'
express = require 'express'


class FakeServer extends Server
    start: ->
        self = this

        @app = Promise.promisifyAll(express())

        @app.all '*', (req, res) ->
            res.json({
                    'method': req.method,
                    'url': req.url,
                    'rawHeaders': req.rawHeaders
                })

        listen = Promise.pending();
        server = @app.listen 5555, (err, value) ->
            if err
                listen.reject(err)
            else
                listen.fulfill(value)

        @server = Promise.promisifyAll(server)

        return listen.promise.then () ->
                self.server = Promise.promisifyAll(server)
                self.internal_addres = 'http://localhost:5555'
                return self.save()

    stop: ->
        return @server.closeAsync()

module.exports = FakeServer
