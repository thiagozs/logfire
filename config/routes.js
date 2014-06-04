'use strict';

module.exports = function (map) {
  /**
   * Routes for `routes/index.js`
   */
  map.get('/', 'index#index');

  /**
   * Routes for `routes/events.js`
   */
  map.post('/events', 'events#create');

  /**
   * Routes for `routes/query.js`
   */
  map.post('/query', 'query#query');
};
