Promise = require 'bluebird'
chai = require 'chai'
expect = chai.expect
chai.use require 'chai-as-promised'

poll = require '../../app/lib/poll'

everFalseTestFn = () ->
    return Promise.delay(40).then -> false

describe 'lib > poll :', ->

    it 'should resolve a ending polling', ->
        i = 1
        testFn = () ->
            answer = i > 6
            i++
            Promise.delay(40).then -> answer

        pollPromise = poll(testFn)

        expect(pollPromise).to.eventually.be.fulfilled;

    it 'should reject a never ending polling', ->
        pollPromise = poll(everFalseTestFn, 1000)
        expect(pollPromise).to.eventually.be.rejectedWith(Promise.TimeoutError);
