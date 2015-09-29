var mongoose = require('mongoose');

module.exports = function(config) {
  // set bluebird as promise engine
  mongoose.Promise = require('bluebird');

  // connects mongodb
  return mongoose.connect(config.mongodb.url);
}
