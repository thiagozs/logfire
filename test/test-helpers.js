'use strict';
require('../lib/autoload');
var path = require('path');
var Logfire = require('lib/logfire');

var TestHelpers = {};

/**
 * Initializes a logfire instance
 * @return {Promise}
 */
TestHelpers.initLogfire = function() {
  var logfire = new Logfire({
    port: 8088,
    config: path.resolve(process.cwd(), 'test/logfire.json')
  });
  return logfire.run()
    .then(function () {
      return logfire;
    });
};

before(function() {
  Log.setLevel('warn');
});

module.exports = TestHelpers;
