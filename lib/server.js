'use strict';

var express = require('express');

function LogfireServer(store, config) {
  this.store = store;
  this.config = config;
}

/**
 * Starts listening on the given port
 * @param  {Number} port
 * @public
 */
LogfireServer.prototype.listen = function(port) {
  this.port = port;

  var self = this;
  return Q.fcall(function() { return self._setupServer(); })
    .then(function() { return self._setupRoutes(); })
    .then(function() {
      self.server.listen(port);
      Log.i('server', 'listening on 0.0.0.0:' + port);
    });
};

/**
 * Initializes the express app
 * @private
 */
LogfireServer.prototype._setupServer = function() {
  this.server = express();

  this.server.use(require('morgan')('short'));
};

/**
 * Loads and runs the routes configuration
 * @private
 */
LogfireServer.prototype._setupRoutes = function() {
  var routes = require('config/routes');
  routes(this.server);
};

module.exports = LogfireServer;
