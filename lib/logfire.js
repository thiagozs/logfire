'use strict';
require('./autoload');

var path = require('path');
var Store = require('./store');
var Server = require('./server');
var Structure = require('./structure');
var TTLService = require('./ttl-service');

function Logfire(options) {
  this.redis = null;
  this.options = options;

  this.config = options.config || this._loadConfig(this.options);
  this._applyDefaultConfig();

  this.store = new Store(this);
  this.server = new Server(this);
  this.structure = new Structure(this, this.config.events);
  this.ttlService = new TTLService(this, this);

  Log.i('ohai', 'logfire-server version ' + require('../package.json').version);
}

/**
 * Main entry point.
 * @public
 */
Logfire.prototype.run = function() {
  var self = this;
  return Promise.try(function() { return self._checkForUpdates(); })
    .then(function() { return self.store.connect(); })
    .then(function () {
      return self.server.listen(self.config.port || 8085);
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
  var config = require(configPath);
  return config;
};

/**
 * Applys the default configuration
 * @private
 */
Logfire.prototype._applyDefaultConfig = function() {
  this.config = _.defaults(this.config, {
    prefix: 'logfire:',
    events: []
  });
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

/**
 * If logfire's `auth` setting is set, this method checks whether
 * the given ?auth query variable is matching.
 * @param  {ClientRequest} request
 * @public
 */
Logfire.prototype.checkAuth = function(request) {
  if (!this.config.auth) return;

  if (this.config.auth !== request.query.auth) {
    throw new LogfireError('Not authenticated.', 403);
  }
};

/**
 * Closes the server, the store and the TTLService
 * @public
 */
Logfire.prototype.close = function() {
  this.server.close();
  this.store.close();
  this.ttlService.stop();
};

module.exports = Logfire;
