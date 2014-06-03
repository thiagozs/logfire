'use strict';
var redis = require('redis');
var fs = require('fs');
var Events = require('./store/events');

function LogfireStore(logfire) {
  this.logfire = logfire;
  this.config = logfire.config;

  this.events = new Events(this.logfire, this);
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
  return Q.ninvoke(this.redis, 'select', index);
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
  return Q.all([
    Q.nfcall(fs.readFile, mixinsPath),
    Q.nfcall(fs.readFile, scriptPath)
  ])
  .then(function (results) {
    // Turn the resulting buffers into strings and join them
    // to one single string
    var code = results.map(function (data) {
      return data.toString();
    }).join('\n\n');

    // Turn the args object into an array
    var redisArgs = [];
    for (var key in args) {
      redisArgs.push(key, args[key]);
    }
    redisArgs.unshift(redisArgs.length / 2);
    redisArgs.unshift(code);

    /*jshint evil:true */
    return Q.ninvoke(self.redis, 'eval', redisArgs);
  });
};

module.exports = LogfireStore;
