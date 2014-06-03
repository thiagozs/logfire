'use strict';

require('rootpath')();

global.Log = new (require('./utils/log'))();
global.Q = require('q');

/**
 * HTTPError definition
 * @param {String} message
 * @param {Number} statusCode
 */
function HTTPError(message, statusCode) {
  this.name = "HTTPError";
  this.message = message || "Internal Error";
  this.statusCode = statusCode || 500;
}
HTTPError.prototype = new Error();
HTTPError.prototype.constructor = HTTPError;

global.HTTPError = HTTPError;
