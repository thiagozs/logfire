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

    if (!body.category) throw new FirelogError('`category` is missing.', 400);
    if (!body.event) throw new FirelogError('`event` is missing.', 400);
  }
};
