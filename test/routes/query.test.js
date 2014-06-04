/*jshint -W030 */
'use strict';

var supertest = require('supertest-as-promised');
var helpers = require('../test-helpers');

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

  var minutes = 60 * 3;
  var successPerMinute = 3;
  var errorPerMinute = 3;
  var date = Math.round(Date.now() / 1000);

  // Seeding
  before(function () {
    this.timeout(20000);

    var tasks = [];
    var event, i;
    for (var minute = 0; minute < minutes; minute++) {
      for (i = 0; i < successPerMinute; i++) {
        event = {
          category: 'video',
          event: 'success',
          data: {
            provider: ['youtube', 'vimeo', 'dailymotion'][Math.floor(Math.random() * 3)],
            video_identifier: 'random',
            $date: date - minute * 60,
            server: Math.round(Math.random() * 5)
          }
        };
        tasks.push(Q.invoke(logfire.store.events, 'create', event));
      }

      for (i = 0; i < errorPerMinute; i++) {
        event = {
          category: 'video',
          event: 'error',
          data: {
            code: ['video_not_found', 'inappropriate_content'][Math.floor(Math.random() * 2)],
            $date: date - minute * 60,
            server: Math.round(Math.random() * 5)
          }
        };
        tasks.push(Q.invoke(logfire.store.events, 'create', event));
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
            parsed.length.should.equal(minutes * successPerMinute);
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
            parsed.length.should.equal(minutes * (successPerMinute + errorPerMinute));
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

  describe('with `start` given', function() {
    it('should only return events created after `start`', function() {
      return supertest(logfire.server.server)
        .get('/query?events=video.success&start=' + (date - 60 * 59))
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function (res) {
          var parsed = JSON.parse(res.body);
          parsed.length.should.equal(60 * (successPerMinute));
        });
    });
  });

  describe('with `start` and `end` given', function() {
    it('should only return events created in this timespan', function() {
      return supertest(logfire.server.server)
        .get('/query?events=video.success&start=' + (date - 60 * 59) + '&end=' + (date - 30 * 60))
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function (res) {
          var parsed = JSON.parse(res.body);
          parsed.length.should.equal(30 * (successPerMinute));
        });
    });
  });

  describe('with `select` given', function() {
    describe('$count', function() {
      it('should only return the count of all events', function() {
        return supertest(logfire.server.server)
          .get('/query?events=video.success&select=$count')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var parsed = JSON.parse(res.body);
            parsed[0].should.equal(minutes * (successPerMinute));
          });
      });

      describe('with a timespan given', function() {
        it('should only return the count of the events in this timespan', function() {
          return supertest(logfire.server.server)
          .get('/query?events=video.success&select=$count&start=' + (date - 60 * 59))
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var parsed = JSON.parse(res.body);
            parsed[0].should.equal(60 * (successPerMinute));
          });
        });
      });
    });

    describe('$id', function() {
      it('should return the id next to other fields', function() {
        return supertest(logfire.server.server)
          .get('/query?events=video.success&select=$id,$date')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var parsed = JSON.parse(res.body);
            Object.keys(parsed[0]).length.should.equal(2);
            parsed[0].$id.should.exist;
            parsed[0].$date.should.exist;
          });
      });

      describe('if the field does not exist in all events', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .get('/query?events=video.success,video.error&select=video_identifier')
            .expect('Content-Type', /json/)
            .expect(JSON.stringify({
              error: 'The field "video_identifier" does not exist in all of the requested events.'
            }))
            .expect(400);
        });
      });
    });

    describe('one specific field', function() {
      it('should only return the specific field for each event', function() {
        return supertest(logfire.server.server)
          .get('/query?events=video.success&select=$date')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var parsed = JSON.parse(res.body);
            Object.keys(parsed[0]).length.should.equal(1);
            parsed[0].$date.should.exist;
          });
      });

      describe('if the field does not exist in all events', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .get('/query?events=video.success,video.error&select=video_identifier')
            .expect('Content-Type', /json/)
            .expect(JSON.stringify({
              error: 'The field "video_identifier" does not exist in all of the requested events.'
            }))
            .expect(400);
        });
      });
    });

    describe('multiple fields', function() {
      it('should return the specific fields for each event', function() {
        return supertest(logfire.server.server)
          .get('/query?events=video.success&select=server,$date')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var parsed = JSON.parse(res.body);
            Object.keys(parsed[0]).length.should.equal(2);
            parsed[0].$date.should.exist;
            parsed[0].server.should.exist;
          });
      });

      describe('if one of the fields does not exist in all events', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .get('/query?events=video.success,video.error&select=$date,video_identifier')
            .expect('Content-Type', /json/)
            .expect(JSON.stringify({
              error: 'The field "video_identifier" does not exist in all of the requested events.'
            }))
            .expect(400);
        });
      });
    });
  });

  describe('with `group` given', function() {
    describe('$event', function() {
      it('should group all events by the event name', function() {
        return supertest(logfire.server.server)
          .get('/query?events=video.success,video.error&group=$event')
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var parsed = JSON.parse(res.body);
            Object.keys(parsed).length.should.equal(2);
            parsed['video.success'].length.should.equal(minutes * successPerMinute);
            parsed['video.error'].length.should.equal(minutes * errorPerMinute);
          });
      });
      describe('in combination with select=$count', function() {
        it('should group the event counts by the event name', function() {
          return supertest(logfire.server.server)
            .get('/query?events=video.success,video.error&group=$event&select=$count')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var parsed = JSON.parse(res.body);
              Object.keys(parsed).length.should.equal(2);
              parsed['video.success'].should.equal(minutes * successPerMinute);
              parsed['video.error'].should.equal(minutes * errorPerMinute);
            });
        });
      });
    });

    describe('$date', function() {
      describe('$date[hour]', function() {
        it('should create buckets for each hour');
      });
      describe('$date[minute]', function() {
        it('should create buckets for each minute');
      });
    });
  });
});
