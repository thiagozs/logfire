'use strict';

var supertest = require('supertest-as-promised');
var helpers = require('../test-helpers');
var should = require('should');

describe('GET /query', function () {
  var logfire = null;
  var server = null;
  before(function () {
    return helpers.initLogfire()
      .then(function (l) {
        logfire = l;
        server = logfire.server.server;
      });
  });
  after(function () {
    server.close();
  });
  before(function () {
    return logfire.store.reset();
  });

  var eventsTotal = 0;
  var successEvents = 0;
  var errorEvents = 0;

  // Seeding
  before(function () {
    this.timeout(20000);

    var tasks = [];
    var event, i;
    for (var minute = 0; minute < 60 * 3; minute++) {
      for (i = 0; i < 3; i++) {
        event = {
          category: 'video',
          event: 'success',
          data: {
            provider: ['youtube', 'vimeo', 'dailymotion'][Math.floor(Math.random() * 3)],
            video_identifier: 'random',
            created_at: Date.now() - minute * 60 * 1000
          }
        };
        tasks.push(Q.invoke(logfire.store.events, 'create', event));
        eventsTotal++;
        successEvents++;
      }

      for (i = 0; i < 5; i++) {
        event = {
          category: 'video',
          event: 'error',
          data: {
            code: ['video_not_found', 'inappropriate_content'][Math.floor(Math.random() * 2)],
            created_at: Date.now() - minute * 60 * 1000
          }
        };
        tasks.push(Q.invoke(logfire.store.events, 'create', event));
        eventsTotal++;
        errorEvents++;
      }
    }
    Log.i('tests', 'Seeding...');
    return Q.all(tasks);
  });

  describe('finding all events', function() {
    describe('without any events given', function() {
      it('should return an error', function() {
        return supertest(logfire.server.server)
          .get('/query')
          .expect('Content-Type', /json/)
          .expect(JSON.stringify({
            error: 'No events given.'
          }))
          .expect(400);
      });
    });


    describe('with only one event given', function() {
      it('should return all events of this event', function() {
        return supertest(logfire.server.server)
          .get('/query?events=video.success')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var parsed = JSON.parse(res.body);
            parsed.length.should.equal(successEvents);
          });
      });

      describe('if the event does not exist', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .get('/query?events=foo.bar')
            .expect('Content-Type', /json/)
            .expect(JSON.stringify({
              error: 'The event "foo.bar" does not exist.'
            }))
            .expect(400);
        });
      });
    });

    describe('with multiple events given', function() {
      it('should return all events of these events', function() {
        return supertest(logfire.server.server)
          .get('/query?events=video.success,video.error')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var parsed = JSON.parse(res.body);
            parsed.length.should.equal(eventsTotal);
          });
      });

      describe('if one of the events does not exist', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
          .get('/query?events=video.success,foo.bar')
          .expect('Content-Type', /json/)
          .expect(JSON.stringify({
            error: 'The event "foo.bar" does not exist.'
          }))
          .expect(400);
        });
      });
    });
  });

  describe('with `start` and/or `end` given', function() {
    it('should only return events in the given range');
  });
});
