#!/usr/bin/env node
'use strict';

var path = require('path');

// CLI
var optimist = require('optimist')
  .usage('\n  Usage: logfire [/path/to/logfire.json] [options]');
var argv = optimist.argv;

// Logfire
var Logfire = require('../lib/logfire');

// --help
if (argv.help === true) return optimist.showHelp();

// Pick allowed options
var defaultConfigPath = path.resolve(process.cwd(), 'logfire.json');
var options = {};
options.config = require(argv._[0] || defaultConfigPath);

// Run logfire server
var logfire = new Logfire(options);
logfire.run();
