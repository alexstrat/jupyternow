var Promise = require('bluebird');

var poll = function(testFn, timeout, interval) {
    timeout = timeout || 10000;
    interval = interval || 100;

    var pollPromise;
    var _poll = function() {
         return testFn()
            .then(function(res) {
                // if not pending, might have been cancelled by timeout
                if(!pollPromise.isPending()) return;

                if(res === false) {
                    return Promise.delay(interval).then(_poll);
                }
            });
    };

    pollPromise= _poll().timeout(timeout);
    return pollPromise;
};

module.exports = poll;
