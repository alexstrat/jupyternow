Promise = require 'bluebird'
chai = require 'chai'
expect = chai.expect
sinon = require 'sinon'
chai.use require 'sinon-chai'
chai.use require 'chai-as-promised'

poll = require '../../app/lib/poll'

delay = (ms, func) -> setTimeout func, ms

describe 'lib > poll :', ->
    i = null
    trueAtSomePointTestFn = everFalseTestFn = null
    everFalseTestFn_spy = trueAtSomePointTestFn_spy = null

    beforeEach ->
        i = 1
        trueAtSomePointTestFn = () ->
            answer = i > 6
            i++
            Promise.delay(40).then -> answer

        everFalseTestFn = () ->
            return Promise.delay(40).then -> false

        trueAtSomePointTestFn_spy = sinon.spy(trueAtSomePointTestFn)
        everFalseTestFn_spy = sinon.spy(everFalseTestFn)

    it 'should resolve a ending polling', ->
        pollPromise = poll(trueAtSomePointTestFn)
        expect(pollPromise).to.eventually.be.fulfilled;

    it 'should reject a never ending polling', ->
        pollPromise = poll(everFalseTestFn_spy, 1000)
        expect(pollPromise).to.eventually.be.rejectedWith(Promise.TimeoutError);

    it 'should not call the poll function after timeout', (done) ->
        pollPromise = poll(everFalseTestFn_spy, 1000)
        pollPromise.then null, ->
            everFalseTestFn_spy.reset()
            delay 300, ->
                expect(everFalseTestFn_spy).to.not.have.been.called
                done()

    it 'should not call the poll function after resolve', (done) ->
        pollPromise = poll(trueAtSomePointTestFn_spy)
        pollPromise.then ->
            trueAtSomePointTestFn_spy.reset()
            delay 300, ->
                expect(trueAtSomePointTestFn_spy).to.not.have.been.called
                done()

