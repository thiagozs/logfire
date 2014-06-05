'use strict';

function LogfireEventsStore(logfire, store) {
  this.logfire = logfire;
  this.config = logfire.config;
  this.store = store;
}

/**
 * Gets all fields of the event with the given id
 * @param  {Number} id
 * @return {Promise}
 * @public
 */
LogfireEventsStore.prototype.get = function(id) {
  if (parseInt(id) != id) throw new LogfireError('`id` has to be an integer.', 400);
  id = parseInt(id);

  var self = this;
  var eventKey = this.config.prefix + 'events:' + id;
  // Check for existence
  return this.store.redis.existsAsync(eventKey)
    .then(function (exists) {
      if (!exists) throw new LogfireError('Event with id "' + id + '" not found.', 404);

      var fieldTypes = self.logfire.structure.getEventFieldTypes();
      return self.store._runLuaScript('get', { prefix: self.config.prefix, id: id, fieldTypes: fieldTypes });
    }).then(function (response) {
      return JSON.parse(response);
    });
};

/**
 * Creates a new event
 * @param  {Object} event
 * @return {Promise}
 * @public
 */
LogfireEventsStore.prototype.create = function(event) {
  if (event.event.indexOf('.') === -1) throw new LogfireError('Invalid event format.', 400);
  if (!event.data) event.data = {};

  var split = event.event.split('.', 2);
  event.category = split[0];
  event.event = split[1];

  var self = this;
  var structure = this.logfire.structure;
  var fullEventName = event.category + '.' + event.event;

  // Validate data
  structure.validateEventData(event);

  // Get the next event ID
  return this._getNextEventId()
    // Create the event object
    .then(function(id) {
      event.id = id;
      event.data.$id = id;
      event.data.$event = fullEventName;
      if (typeof event.data.$date === 'undefined') {
        event.data.$date = Math.round(Date.now() / 1000);
      }
      return self._createEventHash(event);
    })
    .then(function() {
      return self._addToSet(event);
    })
    .then(function() {
      return self._createIndexes(event);
    }).then(function() {
      return event.id;
    });
};

/**
 * Increases the event id and returns the new value
 * @return {Promise}
 * @private
 */
LogfireEventsStore.prototype._getNextEventId = function() {
  return this.store.redis.incrAsync(this.config.prefix + 'events:id');
};

/**
 * Creates the event hash for the given event
 * @param  {Object} event
 * @return {Promise}
 * @private
 */
LogfireEventsStore.prototype._createEventHash = function(event) {
  var eventKey = this.config.prefix + 'events:' + event.id;
  var eventData = event.data;
  return this.store.redis.hmsetAsync(eventKey, eventData);
};

/**
 * Adds the given event to the event set
 * @param {Object} event
 * @return {Promise}
 * @private
 */
LogfireEventsStore.prototype._addToSet = function(event) {
  var fullEventName = event.category + '.' + event.event;
  var setKey = this.config.prefix + 'set:' + fullEventName;
  return this.store.redis.saddAsync(setKey, event.id);
};

/**
 * Adds the id of the given event to a zset for all numeric and date
 * fields
 * @param  {Object} event
 * @return {Promise}
 * @private
 */
LogfireEventsStore.prototype._createIndexes = function(event) {
  var structure = this.logfire.structure;
  var fields = structure.getEventFields(event.category, event.event);
  var promises = [];
  for (var fieldName in fields) {
    var field = fields[fieldName];
    if(typeof event.data[fieldName] === 'undefined') continue;
    if(!structure.isNumericType(field.type)) continue;

    var fullEventName = event.category + '.' + event.event;
    var indexKey = this.config.prefix + 'indexes:' + fullEventName + ':' + fieldName;
    promises.push(this.store.redis.zaddAsync(indexKey, event.data[fieldName], event.id));
  }

  return Promise.all(promises);
};

module.exports = LogfireEventsStore;
