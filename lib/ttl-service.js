'use strict';

function TTLService(logfire) {
  this.logfire = logfire;
  this.config = this.logfire.config;
  this.events = this.config.events;

  if (!this.config.disable_flush) {
    this._scheduleFlush();
  }
}
TTLService.prototype.defaultFlushInterval = 60;
TTLService.prototype.flushing = false;

/**
 * Creates the flush inverval
 * @private
 */
TTLService.prototype._scheduleFlush = function() {
  var self = this;
  var interval = (this.config.flush_interval || this.defaultFlushInterval) * 1000;
  this.flushInterval = setInterval(function() {
    self._flush();
  }, interval);
};

/**
 * Iterates through all events, if `ttl` is set, remove all events older than
 * now - ttl
 * @private
 */
TTLService.prototype._flush = function() {
  var self = this;
  if (this.flushing) {
    return Log.i('ttlservice', 'Not flushing since a flush is already in progress.');
  }
  this.flushing = true;
  Log.d('ttlservice', 'Flushing...');

  var promises = [];
  for(var eventName in this.events) {
    var event = this.events[eventName];
    var ttl = event.ttl;
    if (!ttl) continue;

    Log.d('ttlservice', 'Deleting all ' + eventName + ' events older than ' + ttl + ' seconds.');

    var args = ['flush', {
      event: eventName,
      ttl: ttl,
      now: Math.round(Date.now() / 1000),
      prefix: self.config.prefix,
      fieldTypes: self.logfire.structure.getEventFieldTypes()
    }];
    promises.push(Promise.try(this.logfire.store._runLuaScript, args, this.logfire.store));
  }
  if (promises.length > 0){
    Promise.all(promises).then(function() {
      self.flushing = false;
      Log.d('ttlservice', 'Flushing done.');
    });
  } else {
    self.flushing = false;
  }
};

/**
 * Stops the flush interval
 * @public
 */
TTLService.prototype.stop = function() {
  clearInterval(this.flushInterval);
};

module.exports = TTLService;
