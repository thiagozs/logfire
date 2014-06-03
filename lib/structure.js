'use strict';

function Structure(logfire, categories) {
  this.categories = categories;
}

/**
 * Does the given category exist?
 * @param  {String} category
 * @return {Boolean}
 * @private
 */
Structure.prototype._categoryExists = function(category) {
  return !!this.categories[category];
};

/**
 * Does the given event for the given category exist?
 * @param  {String} category
 * @param  {String} event
 * @return {Boolean}
 * @private
 */
Structure.prototype._eventExists = function(category, event) {
  if (!this._categoryExists(category)) return false;
  return !!this.categories[category].events[event];
};

/**
 * Returns the available fields for the given category and event
 * @param  {String} category
 * @param  {String} event
 * @return {Object}
 * @private
 */
Structure.prototype._getEventFields = function(category, event) {
  return this.categories[category].events[event].fields;
};

/**
 * Returns an array of possible value types for the given value
 * @param  {?} value
 * @return {Array}
 * @private
 */
Structure.prototype._getPossibleTypesForValue = function(value) {
  var types = [];
  if (_.isNumber(value)) {
    types.push('number');
    if (value > 0) {
      types.push('timestamp');
    }
  }
  if (_.isObject(value)) {
    types.push('object');
  }
  if (_.isBoolean(value)) {
    types.push('boolean');
  }
  if (_.isDate(value)) {
    types.push('timestamp');
  }
  if (types.length === 0) {
    types.push('unknown');
  }
  return types;
};

/**
 * Validates that the given data is valid
 * @param  {String} category
 * @param  {String} event
 * @param  {Object} data
 * @private
 */
Structure.prototype.validateEventData = function(category, event, data) {
  // Check for category and event existence
  if (!this._categoryExists(category)) {
    throw new LogfireError('Category "' + category + '" does not exist.', 400);
  }
  if (!this._eventExists(category, event)) {
    throw new LogfireError('Event "' + category + '.' + event + '" does not exist.', 400);
  }

  var fullEventName = category + '.' + event;

  // Check for unknown fields
  var fields = this._getEventFields(category, event);
  var fieldNames = Object.keys(fields);
  for (var name in data) {
    if (fieldNames.indexOf(name) === -1) {
      throw new LogfireError('Field "' + name + '" for event "' + fullEventName + '" does not exist.', 400);
    }
  }

  // Validate field contents
  for (var name in fields) {
    var options = fields[name];
    if (options.required && typeof data[name] === 'undefined') {
      throw new LogfireError('Field "' + name + '" is missing.', 400);
    } else if (typeof(data.name) !== 'undefined') {
      var valueTypes = this._getPossibleTypesForValue(data[name]);
      if (valueTypes.indexOf(options.type) === -1) {
        throw new LogfireError('Field "' + name + '" is of type ' + valueTypes.join('/') + ', but expected it to be ' + options.type + '.', 400);
      }
    }
  }
};

module.exports = Structure;
