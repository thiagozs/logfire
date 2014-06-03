'use strict';

function LogfireEventsStore(logfire, store) {
  this.logfire = logfire;
  this.store = store;
}

/**
 * Creates a new event
 * @param  {Object} data
 * @return {Promise}
 * @public
 */
LogfireEventsStore.prototype.create = function(data) {
  if (!data.category) throw new LogfireError('`category` is missing.', 400);
  if (!data.event) throw new LogfireError('`event` is missing.', 400);

  var category = data.category;
  var event = data.event;
  var data = data.data;
  var structure = this.logfire.structure;

  // Validate data
  structure.validateEventData(category, event, data);
};

module.exports = LogfireEventsStore;
