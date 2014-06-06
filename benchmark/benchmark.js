'use strict';

require('../lib/autoload');

var Logfire = require('lib/logfire');
var async = require('async');
var fs = require('fs');
var exec = Promise.promisify(require('child_process').exec);

var skipSeed = (process.argv.indexOf('--noseed') !== -1);

var eventCount = 50000;
var events = ['event1', 'event2', 'event3'];
var field1 = ['value1', 'value2', 'value3'];
var field2 = ['value1', 'value2', 'value3'];
var field3 = [1, 2, 3];

function Benchmark() {
  // Init server
  var config = require('./logfire.json');
  this.logfire = new Logfire({ config: config });
}

Benchmark.prototype.run = function() {
  var self = this;
  Log.i('benchmark', 'Running benchmark for logfire');

  this.logfire.run()
    .then(function() {
      return self._findRevision();
    })
    .then(function() {
      if (skipSeed) return;
      Log.i('benchmark', 'Flushing redis DB...');
      return self.logfire.store.reset();
    })
    .then(function() { return self._seed(); })
    .then(function() { return self._benchmark(); })
    .then(function(results) {
      Log.i('benchmark', '--- BENCHMARK DONE ---');
      return self._calculateAverages(results);
    })
    .then(function(averages) {
      return self._storeResults(averages);
    })
    .catch(function (e) {
      Log.fatal(e);
    });
};

Benchmark.prototype._findRevision = function() {
  var self = this;
  return exec('git rev-parse HEAD')
    .then(function (response) {
      self.revision = response[0].trim();
    });
};

Benchmark.prototype._storeResults = function(results) {
  var benchmarks = {};
  if (fs.existsSync('benchmark/benchmark.json')) {
    benchmarks = require('./benchmark.json');
  }
  for (var benchmarkName in results) {
    if (!benchmarks[benchmarkName]) benchmarks[benchmarkName] = [];
    benchmarks[benchmarkName].push({
      revision: this.revision,
      average: results[benchmarkName]
    });
  }

  fs.writeFileSync('benchmark/benchmark.json', JSON.stringify(benchmarks, true, 2));
  process.exit(0);
};

Benchmark.prototype._calculateAverages = function(results) {
  var averageResults = {};
  for (var benchmarkName in results) {
    var times = results[benchmarkName];
    var average = Math.round(times.reduce(function (a, b) { return a + b; }) / times.length);
    averageResults[benchmarkName] = average;
    Log.i('benchmark', benchmarkName + ' average: ' + average + 'ms');
  }
  return averageResults;
};

Benchmark.prototype._seed = function() {
  if (skipSeed) return;
  var self = this;
  return new Promise(function (resolve) {
    var queue = async.queue(function(i, cb) {
      if (i % Math.round(eventCount / 10) === 0) {
        Log.i('benchmark', Math.round(i / eventCount * 100) + '%...');
      }
      self.logfire.store.events.create({
        event: events[i % events.length],
        data: {
          field1: field1[i % field1.length],
          field2: field2[i % field2.length],
          field3: field3[i % field3.length]
        }
      }).then(function () {
        cb();
      });
    }, 30);

    queue.drain = function () {
      Log.i('benchmark', 'Seeding done.');
      resolve();
    };

    Log.i('benchmark', 'Building up seeding queue...');
    for ( var i = 0; i < eventCount; i++ ) {
      queue.push(i);
    }
    Log.i('benchmark', 'Seeding ' + eventCount + ' events... might take some time, go grab a coffee.');
  });
};

Benchmark.prototype._benchmark = function() {
  var self = this;
  var benchmarks = {
    // Get events
    'get_all_group_by_event': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: '$event'
      });
    },
    'get_all_group_by_unindexed_string_field': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: 'field1'
      });
    },
    'get_all_group_by_numeric_field': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: 'field3'
      });
    },

    // Count events
    'count_all_group_by_event': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: '$event',
        select: ['$count']
      });
    },
    'count_all_group_by_unindexed_string_field': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: 'field1',
        select: ['$count']
      });
    },
    'count_all_group_by_numeric_field': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: 'field3',
        select: ['$count']
      });
    },

    // Group by indexed field
    // Notice: Indexing is not done yet
    'get_all_group_by_indexed_string_field': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: 'field2'
      });
    },
    'count_all_group_by_indexed_string_field': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: 'field2',
        select: ['$count']
      });
    },

    // Group by date
    'get_all_group_by_date_months': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: '$date[month]'
      });
    },
    'count_all_group_by_date_months': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: '$date[month]',
        select: ['$count']
      });
    },

    'get_all_group_by_date_days': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: '$date[day]'
      });
    },
    'count_all_group_by_date_days': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: '$date[day]',
        select: ['$count']
      });
    },

    'get_all_group_by_date_minutes': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: '$date[minute]'
      });
    },
    'count_all_group_by_date_minutes': function() {
      return self.logfire.store.query.query({
        events: ['event1', 'event2', 'event3'],
        group: '$date[minute]',
        select: ['$count']
      });
    }
  };

  var tasks = [];
  var results = {};
  for(var i = 0; i < 3; i++) {
    Object.keys(benchmarks).forEach(function (benchmarkName) {
      var _i = i;
      var benchmarkFunction = benchmarks[benchmarkName];
      tasks.push(function() {
        Log.i('benchmark', 'Running ' + benchmarkName + ' #' + _i);
        var start = Date.now();
        return benchmarkFunction()
          .then(function() {
            var end = Date.now();
            var duration = end - start;

            if (!results[benchmarkName]) results[benchmarkName] = [];
            results[benchmarkName].push(duration);

            Log.i('benchmark', benchmarkName + ' took ' + duration + 'ms to run.');
          });
      });
    });
  }

  return Promise.map(tasks, function (task) {
    return task();
  }, { concurrency: 1 }).then(function() {
    return results;
  });
};

var benchmark = new Benchmark();
benchmark.run();
