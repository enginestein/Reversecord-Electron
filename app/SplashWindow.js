'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _electron = require('electron');

var _AutoUpdater = require('./AutoUpdater');

var _AutoUpdater2 = _interopRequireDefault(_AutoUpdater);

var _singleInstance = require('./singleInstance');

var _singleInstance2 = _interopRequireDefault(_singleInstance);

var _events = require('events');

var RETRY_CAP_SECONDS = 60;
var ESTIMATED_DURATION_TO_LOAD_MAIN_WINDOW = 1500;

// citron note: atom seems to add about 50px height to the frame on mac but not windows
var LOADING_WINDOW_WIDTH = 300;
var LOADING_WINDOW_HEIGHT = process.platform == 'win32' ? 350 : 300;

var SplashWindow = (function (_EventEmitter) {
  _inherits(SplashWindow, _EventEmitter);

  function SplashWindow(fakeUpdate) {
    _classCallCheck(this, SplashWindow);

    _get(Object.getPrototypeOf(SplashWindow.prototype), 'constructor', this).call(this);

    this.fakeUpdate = fakeUpdate;
    this.checkForUpdateTimeoutId = null;
    this.splashWindow = null;
    this.hasAlreadyLaunched = false;
    this.retryAttempts = 0;

    this.handleError = this.handleError.bind(this);
    this.handleUpdateNotAvailable = this.handleUpdateNotAvailable.bind(this);
    this.handleUpdateAvailable = this.handleUpdateAvailable.bind(this);
    this.handleUpdateDownloaded = this.handleUpdateDownloaded.bind(this);
    _AutoUpdater2['default'].on('error', this.handleError);
    _AutoUpdater2['default'].on('update-not-available', this.handleUpdateNotAvailable);
    _AutoUpdater2['default'].on('update-available', this.handleUpdateAvailable);
    _AutoUpdater2['default'].on('update-downloaded', this.handleUpdateDownloaded);

    this._launchSplashWindow();
  }

  _createClass(SplashWindow, [{
    key: 'focus',
    value: function focus() {
      if (this.splashWindow != null) {
        this.splashWindow.focus();
      }
    }
  }, {
    key: 'handleError',
    value: function handleError() {
      this.retryAttempts += 1;
      var retryInSeconds = Math.min(this.retryAttempts * 10, RETRY_CAP_SECONDS);

      this._cancelTimeout();
      if (this.splashWindow != null) {
        this.splashWindow.webContents.send('ERROR_OCCURRED_NOW_RETRYING', retryInSeconds);
      }

      setTimeout(this._checkForUpdates.bind(this), retryInSeconds * 1000);
    }
  }, {
    key: '_checkForUpdates',
    value: function _checkForUpdates() {
      if (this.splashWindow != null) {
        this.splashWindow.webContents.send('CHECKING_FOR_UPDATES');
      }

      _AutoUpdater2['default'].checkForUpdates();
    }
  }, {
    key: 'handleUpdateDownloaded',
    value: function handleUpdateDownloaded() {
      _AutoUpdater2['default'].quitAndInstall();
    }
  }, {
    key: 'handleUpdateAvailable',
    value: function handleUpdateAvailable() {
      if (this.splashWindow != null) {
        this.splashWindow.webContents.send('UPDATE_AVAILABLE');
        this._cancelTimeout();
      }
    }
  }, {
    key: '_cancelTimeout',
    value: function _cancelTimeout() {
      if (this.checkForUpdateTimeoutId != null) {
        clearTimeout(this.checkForUpdateTimeoutId);
        this.checkForUpdateTimeoutId = null;
      }
    }
  }, {
    key: 'handleUpdateNotAvailable',
    value: function handleUpdateNotAvailable() {
      var _this = this;

      if (this.hasAlreadyLaunched == false && this.splashWindow != null) {
        this.hasAlreadyLaunched = true;
        this.emit(SplashWindow.EVENT_APP_SHOULD_LAUNCH);
        setTimeout(function () {
          return _this.splashWindow.webContents.send('SPLASH_SCREEN_LOADING_APP_NOW');
        }, 1);
        setTimeout(function () {
          _this._destroySelf();
          process.nextTick(function () {
            return _this.emit(SplashWindow.EVENT_APP_SHOULD_SHOW);
          });
        }, ESTIMATED_DURATION_TO_LOAD_MAIN_WINDOW);
      }
    }
  }, {
    key: '_launchSplashWindow',
    value: function _launchSplashWindow() {
      var _this2 = this;

      this.splashWindow = new _electron.BrowserWindow({
        width: LOADING_WINDOW_WIDTH,
        height: LOADING_WINDOW_HEIGHT,
        transparent: false,
        frame: false,
        resizable: false,
        center: true,
        show: false
      });

      if (process.platform == 'win32') {
        // citron note: this causes a crash on quit while the window is open on osx
        this.splashWindow.on('closed', this._onWindowClosed.bind(this));
      }

      _electron.ipcMain.on('SPLASH_SCREEN_READY', function () {
        if (_this2.splashWindow) {
          _this2.splashWindow.show();
        }

        if (_this2.fakeUpdate) {
          var FAKE_DELAY = 2000;
          setTimeout(function () {
            return _this2.handleUpdateNotAvailable();
          }, FAKE_DELAY);
        } else {
          _AutoUpdater2['default'].checkForUpdates();
        }
      });

      this.splashWindow.loadURL('file://' + __dirname + '/splash/index.html');

      var CHECK_FOR_UPDATE_TIMEOUT = 10000;
      this.checkForUpdateTimeoutId = setTimeout(this.handleError.bind(this, {}, 'Timed out'), CHECK_FOR_UPDATE_TIMEOUT);
    }
  }, {
    key: '_onWindowClosed',
    value: function _onWindowClosed() {
      this.splashWindow = null;
      if (!this.hasAlreadyLaunched) {
        // user has closed this window before we launched the app, so let's quit
        _electron.app.quit();
      }
    }
  }, {
    key: '_destroySelf',
    value: function _destroySelf() {
      var _this3 = this;

      _AutoUpdater2['default'].removeListener('error', this.handleError);
      _AutoUpdater2['default'].removeListener('update-not-available', this.handleUpdateNotAvailable);
      _AutoUpdater2['default'].removeListener('update-available', this.handleUpdateAvailable);
      _AutoUpdater2['default'].removeListener('update-downloaded', this.handleUpdateDownloaded);

      this._cancelTimeout();

      if (this.splashWindow != null) {
        // defer the window hiding for a short moment so it gets covered by the main window
        this.splashWindow.setSkipTaskbar(true);
        setTimeout(function () {
          _this3.splashWindow.hide();
          _this3.splashWindow.close();
          _this3.splashWindow = null;
        }, 100);
      }
    }
  }]);

  return SplashWindow;
})(_events.EventEmitter);

exports['default'] = SplashWindow;

SplashWindow.EVENT_APP_SHOULD_LAUNCH = 'appLaunch';
SplashWindow.EVENT_APP_SHOULD_SHOW = 'appShow';
module.exports = exports['default'];