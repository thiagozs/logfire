'use strict';

var supertest = require('supertest-as-promised');
var helpers = require('../test-helpers');
var auth = 'foobarbaz';

describe('authentication', function() {
  var logfire = null;
  var server = null;
  var setupServer = function (auth) {
    before(function () {
      return helpers.initLogfire({
        auth: auth
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
  };

  describe('auth is set', function () {
    setupServer(auth);
    describe('GET /events/:id', function () {
      describe('when not authenticated', function() {
        it('should return an error', function() {
          return supertest(server)
            .get('/events/1')
            .expect(JSON.stringify({
              error: 'Not authenticated.'
            }))
            .expect(403);
        });
      });

      describe('when authenticated', function() {
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
            .get('/events/' + eventId + '?auth=' + auth)
            .expect(200);
        });
      });
    });

    describe('POST /events', function () {
      describe('when not authenticated', function() {
        it('should return an error', function() {
          return supertest(server)
            .post('/events')
            .expect(JSON.stringify({
              error: 'Not authenticated.'
            }))
            .expect(403);
        });
      });

      describe('when authenticated', function() {
        it('should successfully create the event', function() {
          return supertest(server)
            .post('/events?auth=' + auth)
            .send({
              event: 'video.success',
              data: {
                provider: 'youtube',
                video_identifier: 'abcdefghijk'
              }
            })
            .expect(200);
        });
      });
    });

    describe('POST /query', function () {
      describe('when not authenticated', function() {
        it('should return an error', function() {
          return supertest(server)
            .post('/query')
            .expect(JSON.stringify({
              error: 'Not authenticated.'
            }))
            .expect(403);
        });
      });

      describe('when authenticated', function() {
        it('should successfully run a query', function() {
          return supertest(logfire.server.server)
            .post('/query?auth=' + auth)
            .send({
              events: ['video.success']
            })
            .expect('Content-Type', /json/)
            .expect(200);
        });
      });
    });
  });

  describe('auth is not set', function () {
    setupServer(null);
    describe('GET /events/:id', function () {
      describe('when not authenticated', function() {
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
            .expect(200);
        });
      });
    });

    describe('POST /events', function () {
      describe('when not authenticated', function() {
        it('should successfully create an event', function() {
          return supertest(server)
            .post('/events')
            .send({
              event: 'video.success',
              data: {
                provider: 'youtube',
                video_identifier: 'abcdefghijk'
              }
            })
            .expect(JSON.stringify({
              success: true,
              $id: 1
            }))
            .expect(200);
        });
      });
    });

    describe('POST /query', function () {
      describe('when not authenticated', function() {
        it('should successfully run a query', function() {
          return supertest(server)
            .post('/events')
            .send({
              event: 'video.success',
              data: {
                provider: 'youtube',
                video_identifier: 'abcdefghijk'
              }
            })
            .expect(200);
        });
      });
    });
  });
});
