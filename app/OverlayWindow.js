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

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _events = require('events');

// TODO: transparency detection?
// TODO: SHQueryUserNotificationState

var VARIABLES = JSON.parse(_fs2['default'].readFileSync(_path2['default'].join(__dirname, 'notifications', 'variables.json')));

var NotificationWindow = (function (_EventEmitter) {
  _inherits(NotificationWindow, _EventEmitter);

  function NotificationWindow(mainWindow, _ref) {
    var title = _ref.title;
    var maxVisible = _ref.maxVisible;
    var screenPosition = _ref.screenPosition;

    _classCallCheck(this, NotificationWindow);

    _get(Object.getPrototypeOf(NotificationWindow.prototype), 'constructor', this).call(this);

    this.mainWindow = mainWindow;

    this.screen = require('screen');
    this.notifications = [];

    this.title = title;
    this.maxVisible = maxVisible;
    this.screenPosition = screenPosition;

    this.hideTimeout = null;

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
      this.notifications.push(notification);
      this.update();
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
      this.notifications = this.notifications.filter(function (notification) {
        return notification.id !== notificationId;
      });
      this.update();
    }

    // Private

  }, {
    key: 'createWindow',
    value: function createWindow() {
      var _this = this;

      if (this.notificationWindow != null) {
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
        return _this.update();
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
      var _this2 = this;

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
          return _this2.destroyWindow();
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