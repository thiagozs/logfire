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

    // Check if events have the selected fields
    if (typeof options.select !== 'undefined' && options.select !== '$count') {
      var fieldNames = Object.keys(structure.getEventFields(category, eventName));
      var selected = options.select.split(',');
      selected.forEach(function (field) {
        if (fieldNames.indexOf(field) === -1) {
          throw new LogfireError('The field "' + field + '" does not exist in all of the requested events.', 400);
        }
      });
    }
  });

  // Validate `start` and `end`
  if (typeof options.start !== 'undefined') {
    options.start = parseInt(options.start);
  }
  if (typeof options.end !== 'undefined') {
    options.end = parseInt(options.end);
  }

  var args = _.pick(options, [
    'events',
    'start',
    'end',
    'select'
  ]);
  args.prefix = this.config.prefix;
  return this.store._runLuaScript('query', args);
};

module.exports = LogfireQueryStore;
