#!/usr/bin/env node
'use strict';

var _ = require('underscore');

// CLI
var optimist = require('optimist')
  .usage('\n  Usage: logfire [/path/to/logfire.json] [options]')
  .default('port', 8085);
var argv = optimist.argv;

// Logfire
var Logfire = require('../lib/logfire');

// --help
if (argv.help === true) return optimist.showHelp();

// Pick allowed options
var options = _.pick(argv, ['port']);
options.config = argv._[0];

// Run logfire server
var logfire = new Logfire(options);
logfire.run();
