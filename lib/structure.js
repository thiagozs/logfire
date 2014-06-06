'use strict';

function Structure(logfire, events) {
  this.events = events;
  this._addInternalFields();
}

/**
 * Adds internal fields ($id, $date) to all event fields
 * @private
 */
Structure.prototype._addInternalFields = function() {
  for(var eventName in this.events) {
    var event = this.events[eventName];
    event.fields = _.extend(event.fields || {}, {
      $id: {
        type: 'number'
      },
      $date: {
        type: 'timestamp'
      }
    });
  }
};

/**
 * Does the given event exist?
 * @param  {String} event
 * @return {Boolean}
 * @public
 */
Structure.prototype.eventExists = function(event) {
  return !!this.events[event];
};

/**
 * Returns the event with the name
 * @param  {String} event
 * @return {Object}
 * @public
 */
Structure.prototype.getEvent = function(event) {
  if (!this.eventExists(event)) {
    throw new Error('The event "' + event + '" does not exist.');
  }
  return this.events[event];
};

/**
 * Returns the available fields for the given event
 * @param  {String} event
 * @return {Object}
 * @public
 */
Structure.prototype.getEventFields = function(event) {
  if (!this.eventExists(event)) {
    throw new LogfireError('Event "' + event + '" does not exist.', 400);
  }
  return this.events[event].fields;
};

/**
 * Returns a hash containing the field type for each field of each event
 * @return {Object}
 * @public
 */
Structure.prototype.getEventFieldTypes = function() {
  var info = {};
  for (var eventName in this.events) {
    var event = this.events[eventName];

    var fieldTypes = {};
    for (var fieldName in event.fields) {
      fieldTypes[fieldName] = event.fields[fieldName].type;
    }
    info[eventName] = fieldTypes;
  }
  return info;
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
 * Checks whether the given value is a possible value for the type
 * of the given event's `fieldName` field.
 * @param  {Event} event
 * @param  {String} fieldName
 * @param  {?} value
 * @public
 */
Structure.prototype.validateType = function(event, fieldName, value) {
  var possibleValueTypes = this.getPossibleTypesForValue(value);
  var eventFieldType = event.fields[fieldName].type;
  if (possibleValueTypes.indexOf(eventFieldType) === -1) {
    throw new LogfireError('Field "' + fieldName + '" is of type ' + possibleValueTypes.join(' / ') + ', but expected it to be ' + eventFieldType + '.', 400);
  }
};

/**
 * Validates that the given data is valid
 * @param  {Object} data
 * @public
 */
Structure.prototype.validateEventData = function(data) {
  var event = data.event;
  var eventData = data.data;

  // Check for event existence
  if (!this.eventExists(event)) {
    throw new LogfireError('Event "' + event + '" does not exist.', 400);
  }

  // Check for unknown fields
  var fields = this.getEventFields(event);
  var fieldNames = Object.keys(fields);
  var name;
  for (name in eventData) {
    if (fieldNames.indexOf(name) === -1) {
      throw new LogfireError('Field "' + name + '" for event "' + event + '" does not exist.', 400);
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
