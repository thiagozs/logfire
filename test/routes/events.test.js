'use strict';

var supertest = require('supertest');
var helpers = require('../test-helpers');

describe('POST /events', function () {
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
  beforeEach(function () {
    return logfire.store.reset();
  });

  /**
   * Validations
   */

  describe('when category is missing', function () {
    it('should return an error');
  });

  describe('when event is missing', function () {
    it('should return an error');
  });

  describe('when category is unknown', function () {
    it('should return an error');
  });

  describe('when event is unknown', function () {
    it('should return an error');
  });

  describe('when additional data fields are unknown', function () {
    it('should return an error');
  });

  describe('when doing a valid request', function () {
    it('should return a success');
  });
});
