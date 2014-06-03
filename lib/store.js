'use strict';
var redis = require('redis');

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
 * Removes all data
 * @return {Promise}
 * @public
 */
LogfireStore.prototype.reset = function() {
  var deferred = Q.defer();
  deferred.resolve();
  return deferred.promise;
};

module.exports = LogfireStore;
