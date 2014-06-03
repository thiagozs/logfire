'use strict';

var supertest = require('supertest');
var helpers = require('../test-helpers');

describe('GET /', function () {
  var logfire = null;
  var server = null;
  before(function () {
    Log.setLevel('warn');
    return helpers.initLogfire()
      .then(function (l) {
        logfire = l;
        server = logfire.server.server;
      });
  });
  after(function () {
    server.close();
  });

  it('should return the current logfire-server version', function(done) {
    supertest(logfire.server.server)
      .get('/')
      .expect('Content-Type', /json/)
      .expect(JSON.stringify({
        name: 'logfire-server',
        version: require('package.json').version
      }))
      .expect(200, done);
  });
});
