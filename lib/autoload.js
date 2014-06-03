'use strict';

require('rootpath')();

global.Log = new (require('./utils/log'))();
global.Q = require('q');
