'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var regExe = process.env.SystemRoot ? _path2['default'].join(process.env.SystemRoot, 'System32', 'reg.exe') : 'reg.exe';

// Spawn a command and invoke the callback when it completes with an error
// and the output from standard out.
function spawn(command, args, callback) {
  var stdout = '';

  var spawnedProcess = undefined;
  try {
    spawnedProcess = _child_process2['default'].spawn(command, args);
  } catch (error) {
    // Spawn can throw an error
    process.nextTick(function () {
      if (callback != null) {
        callback(error, stdout);
      }
    });
    return;
  }

  spawnedProcess.stdout.on('data', function (data) {
    stdout += data;
  });

  var error = null;
  spawnedProcess.on('error', function (processError) {
    if (error != null) {
      error = processError;
    }
  });
  spawnedProcess.on('close', function (code, signal) {
    if (error === null && code !== 0) {
      error = new Error('Command failed: ' + (signal || code));
    }
    if (error != null) {
      error.code = error.code || code;
      error.stdout = error.stdout || stdout;
    }
    if (callback != null) {
      callback(error, stdout);
    }
  });
}

// Spawn reg.exe and callback when it completes
function spawnReg(args, callback) {
  spawn(regExe, args, callback);
}

function addToRegistry(queue, callback) {
  if (queue.length === 0) {
    if (callback != null) {
      callback();
    }
  } else {
    var args = queue.shift();
    args.unshift('add');
    args.push('/f');
    spawnReg(args, function () {
      return addToRegistry(queue, callback);
    });
  }
}

exports['default'] = {
  spawnReg: spawnReg,
  addToRegistry: addToRegistry,
  spawn: spawn
};
module.exports = exports['default'];