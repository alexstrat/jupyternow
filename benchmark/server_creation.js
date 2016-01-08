var express = require('express'),
  config = require('../config/config'),
  Server = require('../app/models/server'),
  logging = require('winston'),
  rp = require('request-promise'),
  rp_errors = require('request-promise/lib/errors');

var app = express();

require('../config/express')(app, config);
require('../config/mongoose')(config);


var RunTest = function(test_id) {
    var server_name = 'Test Server '+test_id,
    user_id = 'user-test+'+test_id;

    var S;
    logging.profile('Server#createAndStart');
    return Server
        .createAndStart(server_name, user_id)
        .then(function(server) {
            S = server;
            logging.profile('Server#createAndStart');
            return rp({
                'method': 'GET',
                'uri': server.internal_addres,
                 timeout: 200
            })
            .catch(rp_errors.StatusCodeError, function(){return null;});
        }).
        finally(function() {
            logging.info('cleaning everything');
            return S
            .stop()
            .then(function(){
                return S.remove();
            }).then(function(){
                logging.info('Cleaned everything');
            });
        });
};


RunTest('1234').then(
    function(){ logging.info('it worked');},
     function(){ logging.info('it did not work');}
    );
