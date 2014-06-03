'use strict';

module.exports = {
  /**
   * GET /
   * Displays the server version
   * @param  {Logfire} logfire
   * @param  {ClientRequest} req
   * @param  {ServerResponse} res
   */
  index: function (logfire, req, res) {
    res.json({
      name: 'logfire-server',
      version: require('package.json').version
    });
  }
};
