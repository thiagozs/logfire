'use strict';
var moment = require('moment');

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

  var self = this;

  // Check if events exist
  this._validateQueryOptions(options);

  var args = _.pick(options, [
    'events',
    'start',
    'end',
    'select',
    'group',
    'groupSize',
    'where'
  ]);
  args.prefix = this.config.prefix;

  return this.store._runLuaScript('query', args)
    .then(function (result) {
      if (!options.groupSize) return result;
      return self._groupResultByGroupSize(result, options.groupSize);
    });
};

/**
 * Validates the given query options
 * @param  {Object} options
 * @private
 */
LogfireQueryStore.prototype._validateQueryOptions = function(options) {
  var structure = this.logfire.structure;
  var self = this;

  options.events.forEach(function(event) {
    var split = event.split('.');
    var category = split[0];
    var eventName = split[1];

    if (!structure.eventExists(category, eventName)) {
      throw new LogfireError('The event "' + event + '" does not exist.', 400);
    }

    self._validateSelectedFields(category, eventName, options);
    self._validateGroupField(category, eventName, options);
  });

  this._sanitizeTimeFrame(options);
};

/**
 * Makes sure that all events have the fields passed via the `select` option
 * @param  {String} category
 * @param  {String} eventName
 * @param  {Object} options
 * @private
 */
LogfireQueryStore.prototype._validateSelectedFields = function(category, eventName, options) {
  var structure = this.logfire.structure;
  var eventFields = structure.getEventFields(category, eventName);
  var fieldNames;

  // Check if events have the selected fields
  if (typeof options.select !== 'undefined' && options.select[0] !== '$count') {
    eventFields = structure.getEventFields(category, eventName);
    fieldNames = Object.keys(eventFields);
    options.select.forEach(function (field) {
      if (fieldNames.indexOf(field) === -1) {
        throw new LogfireError('The field "' + field + '" does not exist in all of the requested events.', 400);
      }
    });
  }
};

/**
 * Makes sure that the group field is formatted correctly, makes sure
 * it does exist in the given event
 * @param  {String} category
 * @param  {String} eventName
 * @param  {Object} options
 * @private
 */
LogfireQueryStore.prototype._validateGroupField = function(category, eventName, options) {
  // Don't validate if no group is given or if grouping by event name
  if (typeof options.group === 'undefined' || options.group === '$event') {
    return;
  }

  var structure = this.logfire.structure;
  var eventFields = structure.getEventFields(category, eventName);
  var fieldNames = Object.keys(eventFields);

  // `group` can be in the format of groupField[groupSize] if it's
  // a timestamp. In this case, we want to group by `groupField` and
  // handling for `groupSize` in JS (since we have much better date
  // calculation capabilities here).
  var split = options.group.split(/\[|\]/);
  var groupFieldName = split[0];
  var groupSize = split[1];
  if (split.length > 1) {
    // Check if the group field is a timestamp
    if (eventFields[groupFieldName].type !== 'timestamp') {
      throw new LogfireError('The field "' + groupFieldName + '" must be of type "timestamp" to be able to group by a time frame.');
    }

    options.group = groupFieldName;
    options.groupSize = groupSize;
  }

  if (fieldNames.indexOf(options.group) === -1) {
    throw new LogfireError('The field "' + options.group + '" does not exist in all of the requested events.', 400);
  }
};

/**
 * If `start` and/or `end` are given, cast them to integer
 * @param  {Object} options
 * @private
 */
LogfireQueryStore.prototype._sanitizeTimeFrame = function(options) {
  if (typeof options.start !== 'undefined') {
    options.start = parseInt(options.start);
  }
  if (typeof options.end !== 'undefined') {
    options.end = parseInt(options.end);
  }
};

/**
 * Groups the given JSON result by the given groupSize (minute, hour, day,
 * week, month or year)
 * @param  {String} jsonResult
 * @param  {String} groupSize
 * @return {Array}
 * @private
 */
LogfireQueryStore.prototype._groupResultByGroupSize = function(jsonResult, groupSize) {
  var result = JSON.parse(jsonResult);
  var groupsHash = {};
  var groupSizeMapFormats = {
    'minute': 'DD-MM-YYYY-HH-mm',
    'hour': 'DD-MM-YYYY-HH',
    'day': 'DD-MM-YYYY',
    'week': 'WW-MM-YYYY',
    'month': 'MM-YYYY',
    'year': 'YYYY'
  };

  // Sort key
  var sortedKeys = Object.keys(result)
    .map(function (k) { return parseInt(k); })
    .sort(function (a, b) { return a - b; });

  // Grouping
  var groupSizeFormat = groupSizeMapFormats[groupSize];
  sortedKeys.forEach(function (key) {
    var groupKey = moment(new Date(key * 1000)).format(groupSizeFormat);
    if(typeof result[key] === 'number') {
      groupsHash[groupKey] = (groupsHash[groupKey] || 0) + result[key];
    } else {
      groupsHash[groupKey] = (groupsHash[groupKey] || []).concat(result[key]);
    }
  });

  // Convert to array
  var groupsArray = Object.keys(groupsHash).map(function (key) {
    return {
      date: moment(key, groupSizeFormat).format('X'),
      events: groupsHash[key]
    };
  });

  return JSON.stringify(groupsArray);
};

module.exports = LogfireQueryStore;
