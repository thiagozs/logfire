'use strict';

function Structure(logfire, categories) {
  this.categories = categories;
  this._addInternalFields();
}

/**
 * Adds internal fields ($id, $date) to all event fields
 * @private
 */
Structure.prototype._addInternalFields = function() {
  for(var categoryName in this.categories) {
    var category = this.categories[categoryName];
    for(var eventName in category.events) {
      var event = category.events[eventName];
      event.fields = _.extend(event.fields || {}, {
        $id: {
          type: 'number'
        },
        $date: {
          type: 'timestamp'
        }
      });
    }
  }
};

/**
 * Does the given category exist?
 * @param  {String} category
 * @return {Boolean}
 * @public
 */
Structure.prototype.categoryExists = function(category) {
  return !!this.categories[category];
};

/**
 * Does the given event for the given category exist?
 * @param  {String} category
 * @param  {String} event
 * @return {Boolean}
 * @public
 */
Structure.prototype.eventExists = function(category, event) {
  if (!this.categoryExists(category)) return false;
  return !!this.categories[category].events[event];
};

/**
 * Returns the available fields for the given category and event
 * @param  {String} category
 * @param  {String} event
 * @return {Object}
 * @public
 */
Structure.prototype.getEventFields = function(category, event) {
  if (!this.categoryExists(category)) {
    throw new LogfireError('Category "' + category + '" does not exist.', 400);
  }
  if (!this.eventExists(category, event)) {
    throw new LogfireError('Event "' + category + '.' + event + '" does not exist.', 400);
  }
  return this.categories[category].events[event].fields;
};

/**
 * Returns whether the given type is numeric
 * @param  {String}  type
 * @return {Boolean}
 * @public
 */
Structure.prototype.isNumericType = function(type) {
  return ['number', 'timestamp'].indexOf(type) >= 0;
};

/**
 * Returns an array of possible value types for the given value
 * @param  {?} value
 * @return {Array}
 * @public
 */
Structure.prototype.getPossibleTypesForValue = function(value) {
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
  if (_.isString(value)) {
    types.push('string');
  }
  if (types.length === 0) {
    types.push('unknown');
  }
  return types;
};

/**
 * Validates that the given data is valid
 * @param  {Object} data
 * @public
 */
Structure.prototype.validateEventData = function(data) {
  var category = data.category;
  var event = data.event;
  var eventData = data.data;

  // Check for category and event existence
  if (!this.categoryExists(category)) {
    throw new LogfireError('Category "' + category + '" does not exist.', 400);
  }
  if (!this.eventExists(category, event)) {
    throw new LogfireError('Event "' + category + '.' + event + '" does not exist.', 400);
  }

  var fullEventName = category + '.' + event;

  // Check for unknown fields
  var fields = this.getEventFields(category, event);
  var fieldNames = Object.keys(fields);
  var name;
  for (name in eventData) {
    if (fieldNames.indexOf(name) === -1) {
      throw new LogfireError('Field "' + name + '" for event "' + fullEventName + '" does not exist.', 400);
    }
  }

  // Validate field contents
  for (name in fields) {
    var options = fields[name];
    if (options.required && typeof eventData[name] === 'undefined') {
      throw new LogfireError('Field "' + name + '" is missing.', 400);
    } else if (typeof(eventData[name]) !== 'undefined') {
      var valueTypes = this.getPossibleTypesForValue(eventData[name]);
      if (valueTypes.indexOf(options.type) === -1) {
        throw new LogfireError('Field "' + name + '" is of type ' + valueTypes.join('/') + ', but expected it to be ' + options.type + '.', 400);
      }
    }
  }
};

module.exports = Structure;
