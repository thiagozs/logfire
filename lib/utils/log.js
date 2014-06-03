'use strict';
require('colors');

/**
 * A global logging module
 * @param {String} level (default "info")
 */
function Log(level) {
  this.level = level || 'info';
  this.levels = [
    { type: 'debug', color: 'grey', output: console.log },
    { type: 'info', color: 'yellow', output: console.log },
    { type: 'warn', color: 'red', output: console.error },
    { type: 'fatal', color: 'red', fn: this._logFatal }
  ];

  this.prefix = 'logfire-server >'.grey;

  this._initLevels();
}

/**
 * Extends the Log instance with logging functions
 * @private
 */
Log.prototype._initLevels = function() {
  var self = this;
  this.levels.forEach(function (level) {
    self[level.type] = self[level.type[0]] = function (tag) {
      if (!self._shouldLogLevel(level.type)) return;
      if (level.fn) return level.fn.apply(this, arguments);

      var remainingArgs = Array.prototype.slice.call(arguments, 1);
      remainingArgs = remainingArgs.map(function (a) { return a.toString(); });

      var args = [self.prefix, level.type[level.color], ('[' + tag + ']').magenta];
      args = args.concat(remainingArgs);

      level.output.apply(null, args);

      if (level.quit) {
        process.exit(1);
      }
    };
  });
};

/**
 * Decides whether we should output log messages for the given level
 * @param  {String} level
 * @return {Boolean}
 * @private
 */
Log.prototype._shouldLogLevel = function(level) {
  var levels = this.levels.map(function (level) {
    return level.type;
  });
  return levels.indexOf(level) >= levels.indexOf(this.level);
};

/**
 * Custom output method for 'fatal' level (uncaught exceptions). Prints
 * the stack trace and exits the process.
 * @param  {Error} err
 * @private
 */
Log.prototype._logFatal = function(err) {
  console.error(this.prefix, 'uncaught exception'.red, '\n');
  console.error(err.stack.red);
  process.exit(1);
};

/**
 * Sets the log level
 * @param {String} level
 * @public
 */
Log.prototype.setLevel = function(level) {
  this.level = level;
};

module.exports = Log;
