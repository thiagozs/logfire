'use strict';

module.exports = {
  /**
   * POST /events
   * Tracks a single event
   * @param  {ClientRequest} req
   * @param  {ServerResponse} res
   */
  create: function (req, res) {
    var body = req.body;
    if (!body.category) throw new HTTPError('`category` is missing.', 400);
  }
};
