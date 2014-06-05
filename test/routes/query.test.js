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
    var server;
    for (var minute = 0; minute < minutes; minute++) {
      for (i = 0; i < successPerMinute; i++) {
        if (minute < minutes / 2) {
          server = 1;
        } else {
          server = 2;
        }

        event = {
          category: 'video',
          event: 'success',
          data: {
            provider: ['youtube', 'vimeo'][Math.floor(Math.random() * 2)],
            video_identifier: 'random',
            $date: date - minute * 60,
            server: server
          }
        };
        tasks.push(Promise.try(logfire.store.events.create, [event], logfire.store.events));
      }

      for (i = 0; i < errorPerMinute; i++) {
        event = {
          category: 'video',
          event: 'error',
          data: {
            code: ['video_not_found', 'inappropriate_content'][Math.floor(Math.random() * 2)],
            $date: date - minute * 60,
            server: server
          }
        };
        tasks.push(Promise.try(logfire.store.events.create, [event], logfire.store.events));
      }
    }
    Log.i('tests', 'Seeding...');
    return Promise.all(tasks);
  });

  describe('finding all events', function() {
    describe('without any events given', function() {
      it('should return an error', function() {
        return supertest(logfire.server.server)
          .post('/query')
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
          .post('/query')
          .send({
            events: ['video.success']
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            body.length.should.equal(minutes * successPerMinute);
          });
      });

      describe('if the event does not exist', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['foo.bar']
            })
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
          .post('/query')
          .send({
            events: ['video.success', 'video.error']
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            body.length.should.equal(minutes * (successPerMinute + errorPerMinute));
          });
      });

      describe('if one of the events does not exist', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success', 'foo.bar']
            })
            .expect('Content-Type', /json/)
            .expect(JSON.stringify({
              error: 'The event "foo.bar" does not exist.'
            }))
            .expect(400);
        });
      });
    });
  });

  describe('value types', function() {
    describe('without grouping', function() {
      it('should return numeric values as numbers', function() {
        return supertest(logfire.server.server)
          .post('/query')
          .send({
            events: ['video.success']
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            body[0].$id.should.be.a.Number;
            body[0].$date.should.be.a.Number;
            body[0].server.should.be.a.Number;
          });
      });
    });

    describe('when grouping by event name', function() {
      it('should return numeric values as numbers', function() {
        return supertest(logfire.server.server)
          .post('/query')
          .send({
            events: ['video.success'],
            group: '$event'
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            body['video.success'][0].$id.should.be.a.Number;
            body['video.success'][0].$date.should.be.a.Number;
            body['video.success'][0].server.should.be.a.Number;
          });
      });
    });

    describe('when grouping by field', function() {
      it('should return numeric values as numbers', function() {
        return supertest(logfire.server.server)
          .post('/query')
          .send({
            events: ['video.success'],
            group: 'server'
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            body['1'][0].$id.should.be.a.Number;
            body['1'][0].$date.should.be.a.Number;
            body['1'][0].server.should.be.a.Number;
          });
      });
    });
  });

  describe('with `start` given', function() {
    it('should only return events created after `start`', function() {
      return supertest(logfire.server.server)
        .post('/query')
        .send({
          events: ['video.success'],
          start: date - 60 * 59
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function (res) {
          var body = res.body;
          body.length.should.equal(60 * (successPerMinute));
        });
    });
  });

  describe('with `start` and `end` given', function() {
    it('should only return events created in this timespan', function() {
      return supertest(logfire.server.server)
        .post('/query')
        .send({
          events: ['video.success'],
          start: date - 60 * 59,
          end: date - 30 * 60
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function (res) {
          var body = res.body;
          body.length.should.equal(30 * (successPerMinute));
        });
    });
  });

  describe('with `select` given', function() {
    describe('$count', function() {
      it('should only return the count of all events', function() {
        return supertest(logfire.server.server)
          .post('/query')
          .send({
            events: ['video.success'],
            select: ['$count']
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            body.should.equal(minutes * (successPerMinute));
          });
      });

      describe('with a timespan given', function() {
        it('should only return the count of the events in this timespan', function() {
          return supertest(logfire.server.server)
          .post('/query')
          .send({
            events: ['video.success'],
            select: ['$count'],
            start: date - 60 * 59
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            body.should.equal(60 * (successPerMinute));
          });
        });
      });
    });

    describe('$id', function() {
      it('should return the id next to other fields', function() {
        return supertest(logfire.server.server)
          .post('/query')
          .send({
            events: ['video.success'],
            select: ['$id', '$date']
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            Object.keys(body[0]).length.should.equal(2);
            body[0].$id.should.exist;
            body[0].$date.should.exist;
          });
      });

      describe('if the field does not exist in all events', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success', 'video.error'],
              select: ['video_identifier']
            })
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
          .post('/query')
          .send({
            events: ['video.success'],
            select: ['$date']
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            Object.keys(body[0]).length.should.equal(1);
            body[0].$date.should.exist;
          });
      });

      describe('if the field does not exist in all events', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success', 'video.error'],
              select: ['video_identifier']
            })
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
          .post('/query')
          .send({
            events: ['video.success'],
            select: ['server', '$date']
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            Object.keys(body[0]).length.should.equal(2);
            body[0].$date.should.exist;
            body[0].server.should.exist;
          });
      });

      describe('if one of the fields does not exist in all events', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success', 'video.error'],
              select: ['$date', 'video_identifier']
            })
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
          .post('/query')
          .send({
            events: ['video.success', 'video.error'],
            group: '$event'
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            Object.keys(body).length.should.equal(2);
            body['video.success'].length.should.equal(minutes * successPerMinute);
            body['video.error'].length.should.equal(minutes * errorPerMinute);
          });
      });

      describe('in combination with select=$count', function() {
        it('should group the event counts by the event name', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success', 'video.error'],
              select: ['$count'],
              group: '$event'
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              Object.keys(body).length.should.equal(2);
              body['video.success'].should.equal(minutes * successPerMinute);
              body['video.error'].should.equal(minutes * errorPerMinute);
            });
        });
      });
    });

    describe('$date', function() {
      describe('$date[minute]', function() {
        it('should create buckets for each minute', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              group: '$date[minute]',
              start: date - 119 * 60
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              body.length.should.equal(120);
              body[0].date.should.exist;
              body[0].events.length.should.equal(3);
            });
        });
      });
    });

    describe('with a single field', function() {
      it('should group all events by the given field', function() {
        return supertest(logfire.server.server)
          .post('/query')
          .send({
            events: ['video.success', 'video.error'],
            group: 'server'
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .then(function (res) {
            var body = res.body;
            var allEvents = minutes * (successPerMinute + errorPerMinute);
            Object.keys(body).length.should.equal(2);
            body['1'].length.should.equal(allEvents / 2);
            body['2'].length.should.equal(allEvents / 2);
          });
      });

      describe('in combination with select=$count', function() {
        it('should group the event counts by the given field', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success', 'video.error'],
              select: ['$count'],
              group: 'server'
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              var allEvents = minutes * (successPerMinute + errorPerMinute);
              Object.keys(body).length.should.equal(2);
              body['1'].should.equal(allEvents / 2);
              body['2'].should.equal(allEvents / 2);
            });
        });
      });

      describe('in combination with select=field', function() {
        it('should return the event\'s field grouped by the given `group` field', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success', 'video.error'],
              select: ['$id'],
              group: 'server'
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              Object.keys(body).length.should.equal(2);
              Object.keys(body['1'][0]).length.should.equal(1);
              body['1'][0].$id.should.exist;
            });
        });
      });

      describe('if the field does not exist in all events', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success', 'video.error'],
              group: 'video_identifier'
            })
            .expect('Content-Type', /json/)
            .expect(JSON.stringify({
              error: 'The field "video_identifier" does not exist in all of the requested events.'
            }))
            .expect(400);
        });
      });
    });
  });

  describe('with `where` given', function() {
    describe('validations', function() {
      describe('when condition field does not exist in all events', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success', 'video.error'],
              where: {
                video_identifier: 'random'
              }
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .expect(JSON.stringify({
              error: 'The field "video_identifier" does not exist in all of the requested events.'
            }));
        });
      });

      describe('when condition value is of invalid type', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              where: {
                server: 'u wot m8?'
              }
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .expect(JSON.stringify({
              error: 'Field "server" is of type string, but expected it to be number.'
            }));
        });
      });

      describe('when passing an invalid operator', function() {
        it('should return an error', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              where: {
                video_identifier: {
                  foobar: 10
                }
              }
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .expect(JSON.stringify({
              error: 'Invalid operator: "foobar"'
            }));
        });
      });

      describe('numeric operators', function() {
        describe('when used against non-numeric values', function() {
          it('should return an error', function() {
            return supertest(logfire.server.server)
              .post('/query')
              .send({
                events: ['video.success'],
                where: {
                  video_identifier: {
                    $gte: 'foo'
                  }
                }
              })
              .expect('Content-Type', /json/)
              .expect(400)
              .expect(JSON.stringify({
                error: 'Can\'t use numeric operator "$gte" against field "video_identifier" of type string.'
              }));
          });
        });
      });

      describe('array operators', function() {
        describe('when not passing an array', function() {
          it('should return an error', function() {
            return supertest(logfire.server.server)
              .post('/query')
              .send({
                events: ['video.success'],
                where: {
                  video_identifier: {
                    $in: 'foo'
                  }
                }
              })
              .expect('Content-Type', /json/)
              .expect(400)
              .expect(JSON.stringify({
                error: 'Array operator "$in" expects an array as value.'
              }));
          });
        });
      });

      describe('universal operators', function() {
        describe('when value is of invalid type', function() {
          it('should return an error', function() {
            return supertest(logfire.server.server)
              .post('/query')
              .send({
                events: ['video.success'],
                where: {
                  server: {
                    $ne: 'foobarbaz'
                  }
                }
              })
              .expect('Content-Type', /json/)
              .expect(400)
              .expect(JSON.stringify({
                error: 'Can\'t use operator "$ne" with value of type "string" against field "server" of type number.'
              }));
          });
        });
      });
    });

    describe('comparison', function() {
      describe('==', function() {
        it('should only return the events that match the condition', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              where: {
                server: 1
              }
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              body.length.should.equal(minutes * successPerMinute / 2);
            });
        });
      });

      describe('$ne', function() {
        it('should only return the events that match the condition', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              where: {
                server: {
                  $ne: 1
                }
              }
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              body.length.should.equal(minutes * successPerMinute / 2);
              body[0].server.should.equal(2);
            });
        });
      });

      describe('$gt', function() {
        it('should only return the events that match the condition', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              where: {
                server: {
                  $gt: 1
                }
              }
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              body.length.should.equal(minutes * successPerMinute / 2);
              body[0].server.should.equal(2);
            });
        });
      });

      describe('$gte', function() {
        it('should only return the events that match the condition', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              where: {
                server: {
                  $gte: 2
                }
              }
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              body.length.should.equal(minutes * successPerMinute / 2);
              body[0].server.should.equal(2);
            });
        });
      });

      describe('$lt', function() {
        it('should only return the events that match the condition', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              where: {
                server: {
                  $lt: 2
                }
              }
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              body.length.should.equal(minutes * successPerMinute / 2);
              body[0].server.should.equal(1);
            });
        });
      });

      describe('$lte', function() {
        it('should only return the events that match the condition', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              where: {
                server: {
                  $lte: 1
                }
              }
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              body.length.should.equal(minutes * successPerMinute / 2);
              body[0].server.should.equal(1);
            });
        });
      });

      describe('$in', function() {
        it('should only return the events that match the condition', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              where: {
                server: {
                  $in: [1]
                }
              }
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              body.length.should.equal(minutes * successPerMinute / 2);
              body[0].server.should.equal(1);
            });
        });
      });

      describe('$nin', function() {
        it('should only return the events that match the condition', function() {
          return supertest(logfire.server.server)
            .post('/query')
            .send({
              events: ['video.success'],
              where: {
                server: {
                  $nin: [1]
                }
              }
            })
            .expect('Content-Type', /json/)
            .expect(200)
            .then(function (res) {
              var body = res.body;
              body.length.should.equal(minutes * successPerMinute / 2);
              body[0].server.should.equal(2);
            });
        });
      });
    });
  });
});
