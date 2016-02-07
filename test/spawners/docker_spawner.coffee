chai = require 'chai'
expect = chai.expect
chai.use require 'chai-as-promised'
Promise = require 'bluebird'
config = require '../../config/config'
Docker = require 'dockerode'
dockerUtil = require './docker_util'
DockerSpawner = require '../../app/spawners/docker_spawner'

describe 'spawners > docker spawner >', ->
    # docker related proocess might take a while
    @timeout(10000)

    beforeEach ->
        @docker = Promise.promisifyAll(Docker(config.docker.host_config))

        # monkey patch app_lbel to keep track of the containers
        config.docker._app_label = config.docker.app_label
        random = Math.floor(Math.random() * 100) + 1
        config.docker.app_label = config.docker._app_label+random

    afterEach ->
        dockerUtil
            .killAllWithlabel @docker, config.docker.app_label
            .finally ->
                config.docker.app_label = config.docker._app_label


    describe '#spawn', ->

        it 'should work', ->
            s = new DockerSpawner()
            spa = s.spawn base_url: 'foo'

            expect(spa).to.eventually.be.fullfilled
            expect(spa).to.eventually.to.have.property('reference')
            expect(spa).to.eventually.to.have.property('server_address')

    describe '#restart', ->

        s = null
        beforeEach ->
            s = new DockerSpawner()
            spa = s.spawn base_url: 'foo'

        it 'should work', ->
            rs = s.restart base_url: 'bar'
            expect(rs).to.eventually.be.fullfilled
            expect(rs).to.eventually.to.have.property('reference')
            expect(rs).to.eventually.to.have.property('server_address')

    describe.only '#putFileInWorkingDir', ->
        s = null
        beforeEach ->
            s = new DockerSpawner()
            s.spawn base_url: 'foo'
                .then ->
                    s.putFileInWorkingDir 'salut.txt', 'hello\n'

        it 'should have put the file', ->
            c = s.getAppContainer()
            testFile = dockerUtil.runCommandInContainer c, ['test','-f', '/home/jovyan/work/salut.txt']
            expect(testFile).to.eventually.have.deep.property 'inspectData.ExitCode', 0
