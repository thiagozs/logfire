'use strict';

module.exports = {
  /**
   * GET /events/:id
   * @param  {Logfire} logfire
   * @param  {ClientRequest} req
   * @param  {ServerResponse} res
   */
  get: function (logfire, req, res) {
    return Promise.try(logfire.store.events.get, [req.params.id], logfire.store.events)
      .then(function (event) {
        res.json(event);
      });
  },

  /**
   * POST /events
   * Tracks a single event
   * @param  {Logfire} logfire
   * @param  {ClientRequest} req
   * @param  {ServerResponse} res
   */
  create: function (logfire, req, res) {
    return Promise.try(logfire.store.events.create, [req.body], logfire.store.events)
      .then(function (id) {
        res.json({ success: true, $id: id });
      });
  }
};
