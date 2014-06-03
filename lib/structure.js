'use strict';

function Structure(logfire, categories) {
  this.categories = categories;
}

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

module.exports = Structure;
