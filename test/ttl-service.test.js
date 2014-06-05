'use strict';

var helpers = require('./test-helpers');
var sinon = require('sinon');

describe('TTLService', function () {
  var logfire = null;
  var server = null;

  before(function () {
    return helpers.initLogfire({
        ttl_flush_interval: 1
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
    it('should flush every `ttl_flush_interval` seconds', function() {
      this.timeout(4000);
      return new Promise(function (resolve) {
        setTimeout(function () {
          flushSpy.callCount.should.equal(2);
          resolve();
        }, 2100);
      });
    });
  });

  describe('flushing', function() {
    var seed = function(eventName) {
      var tasks = [];
      var now = Math.round(new Date() / 1000);
      for(var minute = 0; minute < 20; minute++) {
        var event = {
          category: 'cache', event: eventName, data: { $date: now - minute * 60 }
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
              events: ['cache.hit'],
              select: ['$count']
            };
            logfire.store.query.query(query)
              .then(function (result) {
                result.should.equal(10);
                resolve();
              })
              .catch(function (err) {
                reject(err);
              });
          }, 2100);
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
          }, 2100);
        });
      });
    });
  });
});
