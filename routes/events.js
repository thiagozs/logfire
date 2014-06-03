'use strict';

module.exports = {
  /**
   * POST /events
   * Tracks a single event
   * @param  {Logfire} logfire
   * @param  {ClientRequest} req
   * @param  {ServerResponse} res
   */
  create: function (logfire, req, res) {
    logfire.store.events.create(req.body)
      .then(function () {
        res.json({ success: true });
      });
  }
};
