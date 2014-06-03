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
      self.server = self.app.listen(port);
      Log.i('server', 'listening on 0.0.0.0:' + port);
    });
};

/**
 * Initializes the express app
 * @private
 */
LogfireServer.prototype._setupServer = function() {
  this.app = express();

  this.app.use(require('body-parser')());

  // Disable server output in test environment
  if (process.env.NODE_ENV !== 'test') {
    this.app.use(require('morgan')('short'));
  }
};

/**
 * Loads and runs the routes configuration
 * @private
 */
LogfireServer.prototype._setupRoutes = function() {
  var self = this;
  var routes = require('config/routes');
  var verbs = ['get', 'post'];

  // Set up the map we pass to the routes module
  var map = {};
  verbs.forEach(function(verb) {
    map[verb] = function (route, actionString) {
      var splitActionString = actionString.split('#');
      var name = splitActionString[0], action = splitActionString[1];

      // Tell express to listen for this route
      self.app[verb](route, function (req, res) {
        var routeMethod = require('routes/' + name)[action];

        // Run the action, wrapped in Q
        Q.fcall(routeMethod, req, res)
          .catch(function (err) {
            if (err instanceof FirelogError) {
              res.json({ error: err.message }, err.statusCode);
            } else {
              res.end('Internal Server Error');
              Log.error(err);
            }
          });
      });
    };
  });

  // Execute the routes script
  routes(map);
};

module.exports = LogfireServer;
