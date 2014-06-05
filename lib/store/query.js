'use strict';
var moment = require('moment');

function LogfireQueryStore(logfire, store) {
  this.logfire = logfire;
  this.config = logfire.config;
  this.store = store;
}

// Comparator types for `where` conditions validations
// Actual comparison happens in Lua
LogfireQueryStore.prototype.numericOperators = ['$gt', '$gte', '$lt', '$lte'];
LogfireQueryStore.prototype.arrayOperators = ['$in', '$nin'];
LogfireQueryStore.prototype.universalOperators = ['$ne'];

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
  args.fieldTypes = this.logfire.structure.getEventFieldTypes();

  return this.store._runLuaScript('query', args)
    .then(function (result) {
      return JSON.parse(result);
    })
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

  options.events.forEach(function(fullEventName) {
    var split = fullEventName.split('.');
    var category = split[0];
    var eventName = split[1];

    if (!structure.eventExists(category, eventName)) {
      throw new LogfireError('The event "' + fullEventName + '" does not exist.', 400);
    }

    var event = structure.getEvent(category, eventName);
    self._validateSelectedFields(event, options);
    self._validateGroupField(event, options);
    self._validateWhereClause(event, options);
  });

  this._sanitizeTimeFrame(options);
};

/**
 * Makes sure that all events have the fields passed via the `select` option
 * @param  {Object} event
 * @param  {Object} options
 * @private
 */
LogfireQueryStore.prototype._validateSelectedFields = function(event, options) {
  var eventFields = event.fields || {};
  var fieldNames = Object.keys(eventFields);

  // Check if events have the selected fields
  if (typeof options.select !== 'undefined' && options.select[0] !== '$count') {
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
 * @param  {Object} event
 * @param  {Object} options
 * @private
 */
LogfireQueryStore.prototype._validateGroupField = function(event, options) {
  // Don't validate if no group is given or if grouping by event name
  if (typeof options.group === 'undefined' || options.group === '$event') {
    return;
  }

  var eventFields = event.fields || {};
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
      throw new LogfireError('The field "' + groupFieldName + '" must be of type "timestamp" to be able to group by a time frame.', 400);
    }

    options.group = groupFieldName;
    options.groupSize = groupSize;
  }

  if (fieldNames.indexOf(options.group) === -1) {
    throw new LogfireError('The field "' + options.group + '" does not exist in all of the requested events.', 400);
  }
};

/**
 * Validates the where clause for the given event (makes sure the fields exist,
 * validates field types)
 * @param  {Object} event
 * @param  {Object} options
 * @private
 */
LogfireQueryStore.prototype._validateWhereClause = function(event, options) {
  if (typeof options.where === 'undefined') return;

  var self = this;
  var structure = this.logfire.structure;
  var whereFields = Object.keys(options.where);
  var eventFields = event.fields || {};

  whereFields.forEach(function (field) {
    // Check field existence
    if (!eventFields[field]) {
      throw new LogfireError('The field "' + field + '" does not exist in all of the requested events.', 400);
    }

    // If condition checks for equality, make sure the given
    // value matches the value type of the field
    var conditionValue = options.where[field];
    var isEqualityCheck = typeof conditionValue !== 'object';
    if (isEqualityCheck) {
      structure.validateType(event, field, conditionValue);
    } else {
      var operators = Object.keys(conditionValue);
      operators.forEach(function (operator) {
        var operatorValue = conditionValue[operator];
        var possibleValueTypes = structure.getPossibleTypesForValue(operatorValue);

        // Check for valid operator
        if (self.numericOperators.indexOf(operator) === -1 &&
          self.arrayOperators.indexOf(operator) === -1 &&
          self.universalOperators.indexOf(operator) === -1) {
            throw new LogfireError('Invalid operator: "' + operator + '"', 400);
        }

        // Array operators only accept arrays
        if (self.arrayOperators.indexOf(operator) >= 0 &&
          !_.isArray(operatorValue)) {
            throw new LogfireError('Array operator "' + operator + '" expects an array as value.', 400);
        }

        // Numeric operators only accept numeric values
        if (self.numericOperators.indexOf(operator) >= 0 &&
          possibleValueTypes.indexOf('number') === -1) {
            throw new LogfireError('Can\'t use numeric operator "' + operator + '" against field "' + field + '" of type ' + possibleValueTypes.join(' / ') + '.', 400);
        }

        // Universal operators only accept correct value types for the field
        if (self.universalOperators.indexOf(operator) >= 0 &&
          possibleValueTypes.indexOf(eventFields[field].type) === -1) {
            throw new LogfireError('Can\'t use operator "' + operator + '" with value of type "' + possibleValueTypes.join(' / ') + '" against field "' + field + '" of type ' + eventFields[field].type + '.', 400);
        }
      });
    }
  });
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
 * @param  {Object} result
 * @param  {String} groupSize
 * @return {Array}
 * @private
 */
LogfireQueryStore.prototype._groupResultByGroupSize = function(result, groupSize) {
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

  return groupsArray;
};

module.exports = LogfireQueryStore;
