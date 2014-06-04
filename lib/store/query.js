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
 * @todo Might want to move some of the validation to `Structure`.
 * @public
 */
LogfireQueryStore.prototype.query = function(options) {
  if (!options.events) throw new LogfireError('No events given.', 400);

  var structure = this.logfire.structure;

  // Check if events exist
  var events = options.events.split(',');
  var split, eventFields, fieldNames;
  var category, eventName;
  events.forEach(function(event) {
    split = event.split('.');
    category = split[0];
    eventName = split[1];

    eventFields = structure.getEventFields(category, eventName);
    if (!structure.eventExists(category, eventName)) {
      throw new LogfireError('The event "' + event + '" does not exist.', 400);
    }

    // Check if events have the selected fields
    if (typeof options.select !== 'undefined' && options.select !== '$count') {
      eventFields = structure.getEventFields(category, eventName);
      fieldNames = Object.keys(eventFields);
      var selected = options.select.split(',');
      selected.forEach(function (field) {
        if (fieldNames.indexOf(field) === -1) {
          throw new LogfireError('The field "' + field + '" does not exist in all of the requested events.', 400);
        }
      });
    }

    // Check if events have the grouping field
    if (typeof options.group !== 'undefined' && options.group !== '$event') {
      eventFields = structure.getEventFields(category, eventName);
      fieldNames = Object.keys(eventFields);

      // `group` can be in the format of field[timespan] if it's
      // a timestamp.
      split = options.group.split(/\[|\]/);
      var groupFieldName = split[0];
      var groupSize = split[1];
      if (split.length > 1) {
        // Check if the group field is a timestamp
        if (eventFields[groupFieldName].type !== 'timestamp') {
          throw new LogfireError('The field "' + groupFieldName + '" must be of type "timestamp" to be able to group by a time frame.');
        } else {
          options.group = groupFieldName;
          options.groupSize = groupSize;
        }
      } else {
        groupFieldName = options.group;
      }

      if (fieldNames.indexOf(groupFieldName) === -1) {
        throw new LogfireError('The field "' + groupFieldName + '" does not exist in all of the requested events.', 400);
      }
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
    'select',
    'group',
    'groupSize'
  ]);
  args.prefix = this.config.prefix;

  return this.store._runLuaScript('query', args);
};

module.exports = LogfireQueryStore;
