'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _electron = require('electron');

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

exports['default'] = _electron.Menu.buildFromTemplate(require('./' + _process2['default'].platform));
module.exports = exports['default'];