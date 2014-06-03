'use strict';

function LogfireQueryStore(logfire, store) {
  this.logfire = logfire;
  this.config = logfire.config;
  this.store = store;
}

/**
 * Queries some data
 * @param  {Object} options
 * @return {Promise}
 * @public
 */
LogfireQueryStore.prototype.query = function(options) {
  if (!options.events) throw new LogfireError('No events given.', 400);

  var self = this;
  var structure = this.logfire.structure;

  // Check if events exist
  var events = options.events.split(',');
  events.forEach(function(event) {
    var split = event.split('.');
    var category = split[0];
    var eventName = split[1];
    if (!structure.eventExists(category, eventName)) {
      throw new LogfireError('The event "' + event + '" does not exist.', 400);
    }
  });

  var args = _.pick(options, [
    'events',
    'start',
    'end'
  ]);
  args.prefix = this.config.prefix;
  return this.store._runLuaScript('query', args);
};

module.exports = LogfireQueryStore;
