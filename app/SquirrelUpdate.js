'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _AutoRunJs = require('./AutoRun.js');

var _AutoRunJs2 = _interopRequireDefault(_AutoRunJs);

var _WindowsSystemJs = require('./WindowsSystem.js');

var _WindowsSystemJs2 = _interopRequireDefault(_WindowsSystemJs);

var _singleInstance = require('./singleInstance');

var _singleInstance2 = _interopRequireDefault(_singleInstance);

// citron note: this assumes the execPath is in the format Discord/someVersion/Discord.exe
var appFolder = _path2['default'].resolve(process.execPath, '..');
var rootFolder = _path2['default'].resolve(appFolder, '..');
var exeName = _path2['default'].basename(process.execPath);
var updateExe = _path2['default'].join(rootFolder, 'Update.exe');

// Spawn the Update.exe with the given arguments and invoke the callback when
// the command completes.
function spawnUpdate(args, callback) {
  _WindowsSystemJs2['default'].spawn(updateExe, args, callback);
}

// Is the Update.exe installed?
function existsSync() {
  return _fs2['default'].existsSync(updateExe);
}

// Restart App.
function restart(app, newVersion) {
  app.once('will-quit', function () {
    var execPath = _path2['default'].resolve(rootFolder, 'app-' + newVersion + '/' + exeName);
    _child_process2['default'].spawn(execPath, [], { detached: true });
  });
  app.quit();
}

// Create a desktop and start menu shortcut by using the command line API
// provided by Squirrel's Update.exe
function createShortcuts(callback, updateOnly) {
  // move icon out to a more stable location, to keep shortcuts from breaking as much
  var icoSrc = _path2['default'].join(appFolder, 'app.ico');
  var icoDest = _path2['default'].join(rootFolder, 'app.ico');
  var icoForTarget = icoDest;
  try {
    var ico = _fs2['default'].readFileSync(icoSrc);
    _fs2['default'].writeFileSync(icoDest, ico);
  } catch (e) {
    // if we can't write there for some reason, just use the source.
    icoForTarget = icoSrc;
  }
  var createShortcutArgs = ['--createShortcut', exeName, '--setupIcon', icoForTarget];
  if (updateOnly) {
    createShortcutArgs.push('--updateOnly');
  }
  spawnUpdate(createShortcutArgs, callback);
}

// Update the desktop and start menu shortcuts by using the command line API
// provided by Squirrel's Update.exe
function updateShortcuts(callback) {
  createShortcuts(callback, true);
}

// Remove the desktop and start menu shortcuts by using the command line API
// provided by Squirrel's Update.exe
function removeShortcuts(callback) {
  spawnUpdate(['--removeShortcut', exeName], callback);
}

// Add a protocol registration for this application.
function installProtocol(protocol, callback) {
  var queue = [['HKCU\\Software\\Classes\\' + protocol, '/ve', '/d', 'URL:' + protocol + ' Protocol'], ['HKCU\\Software\\Classes\\' + protocol, '/v', 'URL Protocol'], ['HKCU\\Software\\Classes\\' + protocol + '\\DefaultIcon', '/ve', '/d', '"' + process.execPath + '",-1'], ['HKCU\\Software\\Classes\\' + protocol + '\\shell\\open\\command', '/ve', '/d', '"' + process.execPath + '" --url "%1"']];

  _WindowsSystemJs2['default'].addToRegistry(queue, callback);
}

// Purge the protocol for this applicationstart.
function uninstallProtocol(protocol, callback) {
  _WindowsSystemJs2['default'].spawnReg(['delete', 'HKCU\\Software\\Classes\\' + protocol, '/f'], callback);
}

function terminate(app) {
  app.quit();
  process.exit(0);
}

// Handle squirrel events denoted by --squirrel-* command line arguments.
function handleStartupEvent(protocol, app, squirrelCommand) {
  switch (squirrelCommand) {
    case '--squirrel-install':
      createShortcuts(function () {
        _AutoRunJs2['default'].install(function () {
          installProtocol(protocol, function () {
            terminate(app);
          });
        });
      }, false);

      return true;
    case '--squirrel-updated':
      updateShortcuts(function () {
        _AutoRunJs2['default'].update(function () {
          installProtocol(protocol, function () {
            terminate(app);
          });
        });
      });
      return true;
    case '--squirrel-uninstall':
      removeShortcuts(function () {
        _AutoRunJs2['default'].clear(function () {
          uninstallProtocol(protocol, function () {
            _singleInstance2['default'].pipeCommandLineArgs(function () {
              return terminate(app);
            }, function () {
              return terminate(app);
            });
          });
        });
      });
      return true;
    case '--squirrel-obsolete':
      terminate(app);
      return true;
    default:
      return false;
  }
}

exports['default'] = {
  spawn: spawnUpdate,
  restart: restart,
  existsSync: existsSync,
  handleStartupEvent: handleStartupEvent
};
module.exports = exports['default'];