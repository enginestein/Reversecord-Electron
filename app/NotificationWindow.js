'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _electron = require('electron');

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _events = require('events');

var _discord_toaster = require('discord_toaster');

var _discord_toaster2 = _interopRequireDefault(_discord_toaster);

var http = require('follow-redirects').http;
var https = require('follow-redirects').https;

// TODO: transparency detection?
// TODO: SHQueryUserNotificationState

var CACHE_MAX_AGE = 24 /*hours*/ * 60 /*minutes*/ * 60 /*seconds*/ * 1000 /*to milliseconds*/;
var tempDir = null;
var iconCache = {};
var nativeSupported = _discord_toaster2['default'].supported();

function hash(someString) {
  var shasum = _crypto2['default'].createHash('sha1');
  shasum.update(someString);
  return shasum.digest('hex');
}

function ensureTempDir() {
  if (!tempDir) {
    tempDir = _path2['default'].join(_os2['default'].tmpdir(), 'discord_toaster_images');
  }
  try {
    _fs2['default'].mkdirSync(tempDir);
  } catch (e) {
    // catch for when it already exists.
  }
  try {
    var tempStat = _fs2['default'].statSync(tempDir);
    return tempStat.isDirectory();
  } catch (e) {
    console.error('fs.statSync error:', e);
  }
  return false;
}

function iconExistsAndIsOld(localPath) {
  try {
    var iconStat = _fs2['default'].statSync(localPath);
    if (iconStat.isFile()) {
      var age = Date.now() - iconStat.mtime.getTime();
      if (age >= CACHE_MAX_AGE) {
        return true;
      }
    }
  } catch (e) {
    // meh
  }
  return false;
}

function cleanUpTempDir() {
  // clean up cache
  try {
    var toDelete = _fs2['default'].readdirSync(tempDir);
    toDelete.forEach(function (fname) {
      var localPath = _path2['default'].join(tempDir, fname);
      if (iconExistsAndIsOld(localPath)) {
        _fs2['default'].unlinkSync(localPath);
      }
    });
  } catch (e) {
    // don't really care that much
    console.error('error clearing cache dir:', e);
  }
}

function checkIfIconCached(key, nodeLocalPath, uriPath) {
  // first try the iconCache
  var cachedRes = iconCache[key];
  if (cachedRes === '') {
    return cachedRes;
    // otherwise, fall through and verify that the file still exists
  }
  // then see if the file is already there
  try {
    var iconStat = _fs2['default'].statSync(nodeLocalPath);
    if (iconStat.isFile()) {
      var age = Date.now() - iconStat.mtime.getTime();
      if (age < CACHE_MAX_AGE) {
        return uriPath;
      }
    }
  } catch (e) {
    // nope, does not exist
  }
  return null;
}

function doNativeShow(notice) {
  var fetcher = null;
  if (notice.icon.indexOf('https:') === 0) {
    fetcher = https;
  } else if (notice.icon.indexOf('http:') === 0) {
    fetcher = http;
  } else if (notice.icon.indexOf('//') !== 0) {
    fetcher = https;
    notice.icon = 'https:' + notice.icon;
  } else if (notice.icon.indexOf('file:') !== 0) {
    notice.icon = '';
  }

  if (fetcher) {
    (function () {
      var doFetchedShow = function doFetchedShow(localUriPath) {
        iconCache[key] = localUriPath;
        notice.icon = localUriPath;
        try {
          _discord_toaster2['default'].show(notice);
        } catch (e) {
          console.error('error in toaster:', e);
        }
      }

      // first try the iconCache

      ;

      var key = hash(notice.icon);
      var nodeLocalPath = _path2['default'].join(tempDir, key);
      var parts = nodeLocalPath.split(_path2['default'].sep);
      var uriPath = 'file:///' + parts.join('/');

      var cachedUri = checkIfIconCached(key, nodeLocalPath, uriPath);
      if (cachedUri !== null) {
        doFetchedShow(cachedUri);
      } else {
        (function () {
          // then download
          var url = notice.icon;
          fetcher.get(url, function (response) {
            if (response.statusCode === 200) {
              if (ensureTempDir()) {
                var file = _fs2['default'].createWriteStream(nodeLocalPath);
                file.on('finish', function () {
                  doFetchedShow(uriPath);
                });
                response.pipe(file);
              } else {
                console.error('can\'t create temp dir');
                doFetchedShow('');
              }
            } else {
              console.error('error code fetching ' + url + ': ' + response.statusCode);
              doFetchedShow('');
            }
          }).on('error', function (e) {
            console.error('error fetching ' + url + ': ' + e.message);
            doFetchedShow('');
          });
        })();
      }
    })();
  } else {
    return _discord_toaster2['default'].show(notice);
  }
  return true;
}

var VARIABLES = JSON.parse(_fs2['default'].readFileSync(_path2['default'].join(__dirname, 'notifications', 'variables.json')));

var NotificationWindow = (function (_EventEmitter) {
  _inherits(NotificationWindow, _EventEmitter);

  function NotificationWindow(mainWindow, _ref) {
    var title = _ref.title;
    var maxVisible = _ref.maxVisible;
    var screenPosition = _ref.screenPosition;
    var appID = _ref.appID;

    _classCallCheck(this, NotificationWindow);

    _get(Object.getPrototypeOf(NotificationWindow.prototype), 'constructor', this).call(this);

    if (nativeSupported) {
      // https://msdn.microsoft.com/en-us/library/windows/desktop/dd378459(v=vs.85).aspx
      // plus see: discord_desktop\tools\squirrel_src\src\Squirrel\UpdateManager.ApplyReleases.cs
      _discord_toaster2['default'].setAppID(appID);
      nativeSupported = ensureTempDir();
      process.on('exit', function (code) {
        cleanUpTempDir();
      });
    }

    this.mainWindow = mainWindow;

    if (!nativeSupported) {
      this.screen = require('screen');
      this.notifications = [];
      this.title = title;
      this.maxVisible = maxVisible;
      this.screenPosition = screenPosition;
      this.hideTimeout = null;
    }

    this.handleNotificationsClear = this.handleNotificationsClear.bind(this);
    this.handleNotificationShow = this.handleNotificationShow.bind(this);
    this.handleNotificationClick = this.handleNotificationClick.bind(this);
    this.handleNotificationClose = this.handleNotificationClose.bind(this);

    _electron.ipcMain.on('NOTIFICATIONS_CLEAR', this.handleNotificationsClear);
    _electron.ipcMain.on('NOTIFICATION_SHOW', this.handleNotificationShow);
    _electron.ipcMain.on('NOTIFICATION_CLICK', this.handleNotificationClick);
    _electron.ipcMain.on('NOTIFICATION_CLOSE', this.handleNotificationClose);
  }

  _createClass(NotificationWindow, [{
    key: 'close',
    value: function close() {
      this.mainWindow = null;

      this.destroyWindow();

      _electron.ipcMain.removeListener('NOTIFICATIONS_CLEAR', this.handleNotificationsClear);
      _electron.ipcMain.removeListener('NOTIFICATION_SHOW', this.handleNotificationShow);
      _electron.ipcMain.removeListener('NOTIFICATION_CLICK', this.handleNotificationClick);
      _electron.ipcMain.removeListener('NOTIFICATION_CLOSE', this.handleNotificationClose);
    }
  }, {
    key: 'handleNotificationsClear',
    value: function handleNotificationsClear() {
      this.notifications = [];
      this.update();
    }
  }, {
    key: 'handleNotificationShow',
    value: function handleNotificationShow(e, notification) {
      var _this = this;

      if (nativeSupported) {
        notification.onClick = function (notificationId) {
          _this.handleNotificationClick(null, notificationId);
        };
        if (notification.silent === undefined) {
          notification.silent = true;
        }
        doNativeShow(notification);
      } else {
        this.notifications.push(notification);
        this.update();
      }
    }
  }, {
    key: 'handleNotificationClick',
    value: function handleNotificationClick(e, notificationId) {
      this.mainWindow.webContents.send('NOTIFICATION_CLICK', notificationId);
      this.emit('notification-click');
    }
  }, {
    key: 'handleNotificationClose',
    value: function handleNotificationClose(e, notificationId) {
      var _this2 = this;

      if (nativeSupported) {
        this.notifications = this.notifications.filter(function (notification) {
          return notification.id !== notificationId;
        });
      } else {
        this.notificationWindow.webContents.send('FADE_OUT', notificationId);
        setTimeout(function () {
          _this2.notifications = _this2.notifications.filter(function (notification) {
            return notification.id !== notificationId;
          });
          _this2.update();
        }, VARIABLES.outDuration);
      }
    }

    // Private

  }, {
    key: 'createWindow',
    value: function createWindow() {
      var _this3 = this;

      if (nativeSupported || this.notificationWindow != null) {
        return;
      }

      this.notificationWindow = new _electron.BrowserWindow({
        title: this.title,
        frame: false,
        resizable: false,
        show: false,
        'accept-first-mouse': true,
        'always-on-top': true,
        'skip-taskbar': true,
        transparent: true,
        'web-preferences': {
          'subpixel-font-scaling': true,
          'direct-write': true
        }
      });
      this.notificationWindow.loadURL('file://' + __dirname + '/notifications/index.html');
      this.notificationWindow.webContents.on('did-finish-load', function () {
        return _this3.update();
      });
    }
  }, {
    key: 'destroyWindow',
    value: function destroyWindow() {
      if (this.notificationWindow == null) {
        return;
      }

      this.notificationWindow.hide();
      this.notificationWindow.close();
      this.notificationWindow = null;
    }
  }, {
    key: 'update',
    value: function update() {
      var _this4 = this;

      if (nativeSupported) {
        return;
      }
      if (this.notifications.length > 0) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;

        if (this.notificationWindow != null) {
          var _calculateBoundingBox = this.calculateBoundingBox();

          var width = _calculateBoundingBox.width;
          var height = _calculateBoundingBox.height;
          var x = _calculateBoundingBox.x;
          var y = _calculateBoundingBox.y;

          this.notificationWindow.setPosition(x, y);
          this.notificationWindow.setSize(width, height);
          this.notificationWindow.showInactive();
        } else {
          this.createWindow();
          return;
        }
      } else if (this.hideTimeout == null) {
        this.hideTimeout = setTimeout(function () {
          return _this4.destroyWindow();
        }, VARIABLES.outDuration * 1.1);
      }

      if (this.notificationWindow != null) {
        this.notificationWindow.webContents.send('UPDATE', this.notifications.slice(0, this.maxVisible));
      }
    }
  }, {
    key: 'calculateBoundingBox',
    value: function calculateBoundingBox() {
      var _mainWindow$getPosition = this.mainWindow.getPosition();

      var _mainWindow$getPosition2 = _slicedToArray(_mainWindow$getPosition, 2);

      var positionX = _mainWindow$getPosition2[0];
      var positionY = _mainWindow$getPosition2[1];

      var _mainWindow$getSize = this.mainWindow.getSize();

      var _mainWindow$getSize2 = _slicedToArray(_mainWindow$getSize, 2);

      var windowWidth = _mainWindow$getSize2[0];
      var windowHeight = _mainWindow$getSize2[1];

      var centerPoint = {
        x: Math.round(positionX + windowWidth / 2),
        y: Math.round(positionY + windowHeight / 2)
      };

      var activeDisplay = this.screen.getDisplayNearestPoint(centerPoint) || this.screen.getPrimaryDisplay();
      var workArea = activeDisplay.workArea;

      var width = VARIABLES.width;
      //const height = (Math.min(this.notifications.length, this.maxVisible) + 1) * VARIABLES.height;
      var height = (this.maxVisible + 1) * VARIABLES.height;

      var x = workArea.x + workArea.width - width;
      var y = undefined;
      switch (this.screenPosition) {
        case 'top':
          y = workArea.y;
          break;
        case 'bottom':
          y = workArea.y + workArea.height - height;
          break;
      }

      return { x: x, y: y, width: width, height: height };
    }
  }]);

  return NotificationWindow;
})(_events.EventEmitter);

exports['default'] = NotificationWindow;
module.exports = exports['default'];