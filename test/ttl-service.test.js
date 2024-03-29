'use strict';

var helpers = require('./test-helpers');
var sinon = require('sinon');

describe('TTLService', function () {
  var logfire = null;
  var server = null;

  before(function () {
    return helpers.initLogfire({
        flush_interval: 1
      })
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

  describe('flush interval', function() {
    var flushSpy;
    before(function() {
      flushSpy = sinon.spy(logfire.ttlService, '_flush');
    });
    after(function() {
      logfire.ttlService._flush.restore();
    });
    it('should flush every `flush_interval` seconds', function() {
      this.timeout(4000);
      return new Promise(function (resolve) {
        setTimeout(function () {
          // Pretty dirty hack to work around race conditions...
          flushSpy.callCount.should.not.equal(0);
          flushSpy.callCount.should.not.equal(1);
          resolve();
        }, 2100);
      });
    });
  });

  describe('flushing', function() {
    var now;
    var seed = function(eventName) {
      var tasks = [];
      now = Math.round(new Date() / 1000);

      // Create 10 in the futue, 10 in the past
      for(var minute = 0; minute < 20; minute++) {
        var date = now + minute * 60;
        if (minute >= 10) {
          // Move the oldest 10 events further to the past to
          // avoid race conditions
          date = now - minute * 60 * 2;
        }
        var event = {
          event: 'cache.' + eventName, data: { $date: date }
        };
        tasks.push(
          Promise.try(logfire.store.events.create, [event], logfire.store.events)
        );
      }
      return Promise.all(tasks);
    };

    describe('when `ttl` is set', function() {
      beforeEach(function() {
        return seed('hit');
      });
      it('should remove events after some time', function() {
        this.timeout(4000);
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            var query = {
              events: ['cache.hit']
            };
            logfire.store.query.query(query)
              .then(function (result) {
                result.length.should.equal(10);
                resolve(result);
              })
              .catch(function (err) {
                reject(err);
              });
          }, 1100);
        }).then(function (events) {
          events.forEach(function (event) {
            (event.$date >= now).should.be.true;
          });
        });
      });

      it('should remove events from indexes and sets', function() {
        this.timeout(4000);
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            Promise.all([
              logfire.store.redis.scardAsync('logfire:set:cache.hit'),
              logfire.store.redis.zcardAsync('logfire:indexes:cache.hit:$date'),
              logfire.store.redis.zcardAsync('logfire:indexes:cache.hit:$id')
            ]).then(function (results) {
              results[0].should.equal(10);
              results[1].should.equal(10);
              results[2].should.equal(10);

              resolve();
            }).catch(function (err) {
              reject(err);
            });
          }, 1100);
        });
      });
    });

    describe('when `ttl` is not set', function() {
      beforeEach(function() {
        return seed('miss');
      });
      it('should not remove events', function() {
        this.timeout(4000);
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            var query = {
              events: ['cache.miss'],
              select: ['$count']
            };
            logfire.store.query.query(query)
              .then(function (result) {
                result.should.equal(20);
                resolve();
              })
              .catch(function (err) {
                reject(err);
              });
          }, 1100);
        });
      });
    });
  });
});
