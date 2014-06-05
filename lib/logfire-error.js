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
