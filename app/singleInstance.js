'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _electron = require('electron');

var _net = require('net');

var _net2 = _interopRequireDefault(_net);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var releaseChannel = require(_path2['default'].join(__dirname, '../package.json')).releaseChannel;

function deleteSocketFile(socketPath) {
  if (process.platform === 'win32') {
    return;
  }

  if (_fs2['default'].existsSync(socketPath)) {
    try {
      _fs2['default'].unlinkSync(socketPath);
    } catch (error) {
      // Ignore ENOENT errors in case the file was deleted between the exists
      // check and the call to unlink sync. This occurred occasionally on CI
      // which is why this check is here.
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

/**
 * Creates server to listen for additional atom application launches.
 *
 * You can run the command multiple times, but after the first launch
 * the other launches will just pass their information to this server and then
 * close immediately.
 */
function listenForArgumentsFromNewProcess(socketPath, callback) {
  deleteSocketFile(socketPath);

  var server = _net2['default'].createServer(function (connection) {
    connection.on('data', function (data) {
      var args = JSON.parse(data);
      callback(args);
    });
  });
  server.listen(socketPath);
  server.on('error', function (error) {
    return console.error('Application server failed', error);
  });
  return server;
}

function tryStart(socketPath, callback, otherAppFound) {
  // FIXME: Sometimes when socketPath doesn't exist, net.connect would strangely
  // take a few seconds to trigger 'error' event, it could be a bug of node
  // or atom-shell, before it's fixed we check the existence of socketPath to
  // speedup startup.
  if (process.platform !== 'win32' && !_fs2['default'].existsSync(socketPath)) {
    callback();
    return;
  }

  var client = _net2['default'].connect({ path: socketPath }, function () {
    client.write(JSON.stringify(process.argv.slice(1)), function () {
      client.end();
      otherAppFound();
    });
  });
  client.on('error', callback);
}

function makeSocketPath() {
  var name = _electron.app.getName();
  if (releaseChannel !== 'stable') {
    name = _electron.app.getName() + releaseChannel;
  }

  if (process.platform === 'win32') {
    return '\\\\.\\pipe\\' + name + '-sock';
  } else {
    return _path2['default'].join(_os2['default'].tmpdir(), name + '.sock');
  }
}

function create(startCallback, newProcessCallback) {
  var socketPath = makeSocketPath();

  tryStart(socketPath, function () {
    var server = listenForArgumentsFromNewProcess(socketPath, newProcessCallback);

    _electron.app.on('will-quit', function () {
      server.close();
      deleteSocketFile(socketPath);
    });

    _electron.app.on('will-exit', function () {
      server.close();
      deleteSocketFile(socketPath);
    });

    startCallback();
  }, function () {
    _electron.app.terminate();
  });
}

function pipeCommandLineArgs(noOtherAppFoundCallback, otherAppFound) {
  tryStart(makeSocketPath(), noOtherAppFoundCallback, otherAppFound);
}

exports['default'] = {
  create: create,
  pipeCommandLineArgs: pipeCommandLineArgs,
  releaseChannel: releaseChannel
};
module.exports = exports['default'];