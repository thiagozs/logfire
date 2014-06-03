'use strict';
var redis = require('redis');
var fs = require('fs');

function LogfireStore(logfire) {
  this.logfire = logfire;
  this.config = logfire.config;
}

/**
 * Connects to the redis store
 * @return {Promise}
 * @public
 */
LogfireStore.prototype.connect = function() {
  var self = this;

  var redisConfig = this.config.redis;
  this.redis = redis.createClient(redisConfig.port, redisConfig.host, {
    auth_pass: redisConfig.auth
  });

  var deferred = Q.defer();
  this.redis.on('connect', function () {
    if (typeof redisConfig.db === 'undefined') {
      return deferred.resolve();
    }

    self._selectDatabase(redisConfig.db)
      .then(function () {
        deferred.resolve();
      })
      .catch(function (e) {
        deferred.reject(e);
      });
  });
  this.redis.on('error', function (err) {
    deferred.reject(err);
  });
  return deferred.promise;
};

/**
 * Removes all redis keys with the configured prefix
 * @return {Promise}
 * @public
 * @notice
 *   DO NOT USE THIS IN PRODUCTION, SINCE IT USES
 *   THRE REDIS KEYS COMMAND
 */
LogfireStore.prototype.reset = function() {
  return this._runLuaScript('clean', { prefix: this.config.prefix });
};

/**
 * Selects the given database index
 * @param  {Number} index
 * @return {Promise}
 * @private
 */
LogfireStore.prototype._selectDatabase = function(index) {
  var deferred = Q.defer();
  this.redis.select(index, function (err) {
    if (err) return deferred.reject(err);
    deferred.resolve();
  });
  return deferred.promise;
};

/**
 * Runs the Lua script with the given name
 * @param  {String} name
 * @param  {Object} args
 * @return {Promise}
 * @private
 */
LogfireStore.prototype._runLuaScript = function(name, args) {
  var self = this;
  var mixinsPath = 'lib/lua/_mixins.lua';
  var scriptPath = 'lib/lua/' + name + '.lua';
  var scriptContents;
  return Q.nfcall(fs.readFile, scriptPath)
    .then(function (contents) {
      scriptContents = contents.toString();
    })
    .then(function() {
      return Q.nfcall(fs.readFile, mixinsPath);
    })
    .then(function(mixinsContents) {
      var code = mixinsContents + '\n\n' + scriptContents;

      // Turn the args object into an array
      var redisArgs = [];
      for (var key in args) {
        redisArgs.push(key, args[key]);
      }
      redisArgs.unshift(redisArgs.length / 2);
      redisArgs.unshift(code);

      /*jshint evil:true */
      return Q.npost(self.redis, 'eval', redisArgs);
    });
};

module.exports = LogfireStore;
