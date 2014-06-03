'use strict';

module.exports = {
  /**
   * GET /
   * Displays the server version
   * @param  {ClientRequest} req
   * @param  {ServerResponse} res
   */
  index: function (req, res) {
    res.json({
      name: 'logfire-server',
      version: require('package.json').version
    });
  }
};
