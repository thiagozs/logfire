'use strict';

module.exports = {
  /**
   * POST /query
   * Runs a query on the data
   * @param  {Logfire} logfire
   * @param  {ClientRequest} req
   * @param  {ServerResponse} res
   */
  query: function (logfire, req, res) {
    return Q.invoke(logfire.store.query, 'query', req.body)
      .then(function (response) {
        res.setHeader('Content-Type', 'application/json');
        res.end(response);
      });
  }
};
