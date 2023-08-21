'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
//exports['default'] = process.binding('discord_utils');
//module.exports = exports['default'];

var noop = function noop() {};

exports['default'] = {
  shouldDisplayNotifications: true,
  getIdleMilliseconds: noop,
  setGameCandidateOverrides: noop,
  setProcessPriority: noop
}
module.exports = exports['default'];
