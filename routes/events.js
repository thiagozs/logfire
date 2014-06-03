'use strict';

module.exports = {
  /**
   * POST /events
   * Tracks a single event
   * @param  {ClientRequest} req
   * @param  {ServerResponse} res
   */
  create: function (req, res) {
    console.log(req.body);
  }
};
