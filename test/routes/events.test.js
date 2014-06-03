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
    it('should return an error', function (done) {
      supertest(server)
        .post('/events')
        .send({ event: 'success' })
        .expect(JSON.stringify({
          error: '`category` is missing.'
        }))
        .expect(400, done);
    });
  });

  describe('when event is missing', function () {
    it('should return an error', function (done) {
      supertest(server)
        .post('/events')
        .send({ category: 'video' })
        .expect(JSON.stringify({
          error: '`event` is missing.'
        }))
        .expect(400, done);
    });
  });

  describe('when category is unknown', function () {
    it('should return an error', function (done) {
      supertest(server)
        .post('/events')
        .send({ category: 'foobar', event: 'success' })
        .expect(JSON.stringify({
          error: 'Category "foobar" does not exist.'
        }))
        .expect(400, done);
    });
  });

  describe('when event is unknown', function () {
    it('should return an error', function (done) {
      supertest(server)
        .post('/events')
        .send({ category: 'video', event: 'foobar' })
        .expect(JSON.stringify({
          error: 'Event "video.foobar" does not exist.'
        }))
        .expect(400, done);
    });
  });

  describe('when additional data fields are unknown', function () {
    it('should return an error', function (done) {
      supertest(server)
        .post('/events')
        .send({
          category: 'video',
          event: 'success',
          data: {
            foobar: 'uwotm8'
          }
        })
        .expect(JSON.stringify({
          error: 'Field "foobar" for event "video.success" does not exist.'
        }))
        .expect(400, done);
    });
  });

  describe('when required data fields are missing', function () {
    it('should return an error', function (done) {
      supertest(server)
        .post('/events')
        .send({
          category: 'video',
          event: 'success',
          data: {
            provider: 'youtube',
            video_identifier: 'abcdefghijk'
          }
        })
        .expect(JSON.stringify({
          error: 'Field "created_at" is missing.'
        }))
        .expect(400, done);
    });
  });

  describe('when doing a of wrong type', function () {
    it('should return success', function (done) {
      supertest(server)
        .post('/events')
        .send({
          category: 'video',
          event: 'success',
          data: {
            provider: 'youtube',
            video_identifier: 'abcdefghijk',
            created_at: 'foobar'
          }
        })
        .expect(JSON.stringify({
          error: 'Field "created_at" is of type string, but expected it to be timestamp.'
        }))
        .expect(400, done);
    });
  });

  describe('when doing a valid request', function () {
    it('should return success', function (done) {
      supertest(server)
        .post('/events')
        .send({
          category: 'video',
          event: 'success',
          data: {
            provider: 'youtube',
            video_identifier: 'abcdefghijk',
            created_at: Date.now()
          }
        })
        .expect(JSON.stringify({
          success: true
        }))
        .expect(200, done);
    });
  });
});
