'use strict';

require('longjohn');
require('rootpath')();

global.Log = new (require('./utils/log'))();
global.Q = require('q');
global._ = require('underscore');

/**
 * LogfireError definition
 * @param {String} message
 * @param {Number} statusCode
 */
function LogfireError(message, statusCode) {
  this.name = 'LogfireError';
  this.message = message || 'Internal Error';
  this.statusCode = statusCode || 500;
}
LogfireError.prototype = new Error();
LogfireError.prototype.constructor = LogfireError;

global.LogfireError = LogfireError;
