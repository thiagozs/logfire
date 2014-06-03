'use strict';

require('rootpath')();

global.Log = new (require('./utils/log'))();
global.Q = require('q');

/**
 * FirelogError definition
 * @param {String} message
 * @param {Number} statusCode
 */
function FirelogError(message, statusCode) {
  this.name = 'FirelogError';
  this.message = message || 'Internal Error';
  this.statusCode = statusCode || 500;
}
FirelogError.prototype = new Error();
FirelogError.prototype.constructor = FirelogError;

global.FirelogError = FirelogError;
