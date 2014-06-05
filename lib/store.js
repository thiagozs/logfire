'use strict';
var redis = require('redis');
var fs = require('fs');
var Events = require('./store/events');
var Query = require('./store/query');

function LogfireStore(logfire) {
  this.logfire = logfire;
  this.config = logfire.config;

  this.events = new Events(this.logfire, this);
  this.query = new Query(this.logfire, this);
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
  var scriptPath = 'lib/lua/' + name + '.lua';
  return Q.nfcall(fs.readFile, scriptPath)
    .then(function (script) {
      // Split script into lines
      var scriptLines = script.toString().split('\n');

      // Find `require` statements, find their corresponding
      // files, replace the statements with the file contents
      var code = '';
      scriptLines.forEach(function (line) {
        var match = line.match(/^(?!\s+)?require "(.*?)"/i);
        if (match) {
          var filePath = 'lib/lua/' + match[1] + '.lua';
          var contents = fs.readFileSync(filePath);
          code += '\n' + contents + '\n';
        } else {
          code += line + '\n';
        }
      });

      // Stringify `Object` arguments
      for(var key in args) {
        if (_.isObject(args[key])) {
          args[key] = JSON.stringify(args[key]);
        }
      }

      // Turn the args object into an array
      var redisArgs = [code, _.keys(args).length]
        .concat(_.keys(args))
        .concat(_.values(args));

      /*jshint evil:true */
      return Q.ninvoke(self.redis, 'eval', redisArgs)
        .catch(function(err) {
          self._printLuaError(name, code, err);
        });
    });
};

/**
 * Generates nice and readable output for Lua errors
 * @param  {String} name
 * @param  {String} code
 * @param  {Error} err
 * @private
 */
LogfireStore.prototype._printLuaError = function(name, code, err) {
  var message = err.message;
  var codeLines = code.split('\n');
  var match = message.match(/user_script:([0-9]+):\s+?(.*)/);
  var line = parseInt(match[1]);

  Log.w('lua:' + name, ('lua error: ' + match[2]).red);

  // Print lines
  for (var i = Math.max(0, line - 5);
    i < Math.min(codeLines.length, line + 5);
    i++) {
      var prefix = '   | ';
      if (i === line - 1) {
        prefix = ' > | ';
      }
      var output = prefix + codeLines[i];
      if (i === line - 1) {
        output = output.red;
      }
      Log.w('lua:' + name, output);
  }
};

module.exports = LogfireStore;
