'use strict';
require('../lib/autoload');

var fs = require('fs');
var path = require('path');
var Logfire = require('lib/logfire');

var TestHelpers = {};

/**
 * Initializes a logfire instance
 * @return {Promise}
 */
TestHelpers.initLogfire = function(additionalConfig) {
  if (!additionalConfig) additionalConfig = {};

  var config = require(path.resolve(process.cwd(), 'test/logfire.json'));
  config = _.extend(config, additionalConfig);

  var logfire = new Logfire({
    port: 8088,
    config: config
  });
  return logfire.run()
    .then(function () {
      return logfire;
    });
};

before(function() {
  Log.setLevel('info');
});

module.exports = TestHelpers;
