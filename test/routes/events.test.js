'use strict';

var supertest = require('supertest-as-promised');
var helpers = require('../test-helpers');
var should = require('should');

describe('/events', function() {
  var logfire = null;
  var server = null;
  before(function () {
    return helpers.initLogfire({
      disable_flush: true
    })
      .then(function (l) {
        logfire = l;
        server = logfire.server.server;
      });
  });
  after(function () {
    logfire.close();
  });
  beforeEach(function () {
    return logfire.store.reset();
  });

  describe('GET /events/:id', function () {
    /**
     * Validations
     */

    describe('when id is not an integer', function () {
      it('should return an error', function() {
        return supertest(server)
          .get('/events/foo')
          .expect(JSON.stringify({
            error: '`id` has to be an integer.'
          }))
          .expect(400);
      });
    });

    describe('when event with this id can not be found', function () {
      it('should return an error', function() {
        return supertest(server)
          .get('/events/123123')
          .expect(JSON.stringify({
            error: 'Event with id "123123" not found.'
          }))
          .expect(404);
      });
    });

    describe('when doing a correct request', function () {
      var eventId;

      beforeEach(function() {
        return logfire.store.events.create({
          event: 'cache.miss'
        }).then(function (id) {
          eventId = id;
        });
      });

      it('should return the event', function() {
        return supertest(server)
          .get('/events/' + eventId)
          .expect(200)
          .then(function (response) {
            var body = response.body;
            body.$id.should.equal(eventId);
            should.exist(body.$date.should);
            body.$event.should.equal('cache.miss');
          });
      });
    });
  });

  describe('POST /events', function () {
    /**
     * Validations
     */

    describe('when event format is invalid', function () {
      it('should return an error', function (done) {
        supertest(server)
          .post('/events')
          .send({ event: 'success' })
          .expect(JSON.stringify({
            error: 'Invalid event format.'
          }))
          .expect(400, done);
      });
    });

    describe('when category is unknown', function () {
      it('should return an error', function (done) {
        supertest(server)
          .post('/events')
          .send({ event: 'foobar.success' })
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
          .send({ event: 'video.foobar' })
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
            event: 'video.success',
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
            event: 'video.success',
            data: {
              video_identifier: 'abcdefghijk'
            }
          })
          .expect(JSON.stringify({
            error: 'Field "provider" is missing.'
          }))
          .expect(400, done);
      });
    });

    describe('when doing a of wrong type', function () {
      it('should return success', function (done) {
        supertest(server)
          .post('/events')
          .send({
            event: 'video.success',
            data: {
              provider: 'youtube',
              video_identifier: 'abcdefghijk',
              server: 'foobar'
            }
          })
          .expect(JSON.stringify({
            error: 'Field "server" is of type string, but expected it to be number.'
          }))
          .expect(400, done);
      });
    });

    describe('when doing a valid request', function () {
      it('should return success', function (done) {
        supertest(server)
          .post('/events')
          .send({
            event: 'video.success',
            data: {
              provider: 'youtube',
              video_identifier: 'abcdefghijk'
            }
          })
          .expect(JSON.stringify({
            success: true
          }))
          .expect(200, done);
      });

      it('should create an event', function () {
        return supertest(server)
          .post('/events')
          .send({
            event: 'video.success',
            data: {
              provider: 'youtube',
              video_identifier: 'abcdefghijk'
            }
          })
          .expect(200)
          .then(function () {
            var redis = logfire.store.redis;
            return redis.hgetallAsync('logfire:events:1');
          })
          .then(function (result) {
            should.exist(result);
          });
      });

      it('should add numeric values to index', function () {
        return supertest(server)
          .post('/events')
          .send({
            event: 'video.success',
            data: {
              provider: 'youtube',
              video_identifier: 'abcdefghijk',
              server: 5
            }
          })
          .expect(200)
          .then(function () {
            var redis = logfire.store.redis;
            return Promise.all([
              redis.zrangebyscoreAsync('logfire:indexes:video.success:$date', '-inf', '+inf', 'withscores'),
              redis.zrangebyscoreAsync('logfire:indexes:video.success:server', '-inf', '+inf', 'withscores')
            ]);
          })
          .then(function (results) {
            results.length.should.equal(2);
            results[0].length.should.equal(2);
            results[1].length.should.equal(2);
          });
      });
    });
  });

});
