'use strict';
require('./autoload');

var path = require('path');
var Store = require('./store');
var Server = require('./server');

function Logfire(options) {
  this.redis = null;
  this.options = options;
  this.config = this._loadConfig(this.options);

  this.store = new Store(this);
  this.server = new Server(this);

  Log.i('ohai', 'logfire-server version ' + require('../package.json').version);
}

/**
 * Main entry point.
 * @public
 */
Logfire.prototype.run = function() {
  var self = this;
  return Q.fcall(function() { return self._checkForUpdates(); })
    .then(function() { return self.store.connect(); })
    .then(function () {
      return self.server.listen(self.options.port);
    })
    .catch(function (err) {
      Log.fatal(err);
    });
};

/**
 * Loads and returns the configuration
 * @return {Object}
 * @private
 */
Logfire.prototype._loadConfig = function() {
  var configPath = path.resolve(process.cwd(), this.options.config);
  return require(configPath);
};

/**
 * Checks for new versions, warns the user if there's an update
 * @return {Promise}
 * @private
 */
Logfire.prototype._checkForUpdates = function() {
  Log.i('ohai', 'not checking for updates, yet... implement this.');
  return;
};

module.exports = Logfire;
