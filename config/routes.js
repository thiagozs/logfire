'use strict';

module.exports = function (app) {
  app.get('/', require('routes/index').index);
};
