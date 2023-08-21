'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _electron = require('electron');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _AutoRunJs = require('./AutoRun.js');

var _AutoRunJs2 = _interopRequireDefault(_AutoRunJs);

// these are lazy loaded into temp files
var badgeEnabledImagePath = null;
var badgeDisableImagePath = null;

function exposeAsarTempFile(asarPath, fileName) {
  var fullPathToAsarFile = _path2['default'].join(_electron.app.getAppPath(), asarPath, fileName);
  var data = _fs2['default'].readFileSync(fullPathToAsarFile);
  var nativeFilePath = _path2['default'].join(_electron.app.getPath('userData'), fileName);
  _fs2['default'].writeFileSync(nativeFilePath, data);
  return nativeFilePath;
}

var SystemTray = (function () {
  function SystemTray(onCheckForUpdates, onQuit, onTrayClicked, appSettings) {
    var _this = this;

    _classCallCheck(this, SystemTray);

    if (badgeDisableImagePath == null) {
      badgeDisableImagePath = exposeAsarTempFile('app/images', 'tray.png');
    }

    if (badgeEnabledImagePath == null) {
      badgeEnabledImagePath = exposeAsarTempFile('app/images', 'tray-unread.png');
    }

    this.appSettings = appSettings;
    this.atomTray = new _electron.Tray(badgeDisableImagePath);

    this.contextMenu = [{
      label: 'Run ' + _path2['default'].basename(process.execPath, '.exe') + ' when my computer starts',
      type: 'checkbox',
      checked: false,
      enabled: false,
      click: this.toggleRunOnStartup.bind(this)
    }, {
      label: 'Check for updates',
      type: 'normal',
      click: onCheckForUpdates
    }, {
      type: 'separator'
    }, {
      label: 'Quit Discord',
      type: 'normal',
      click: onQuit
    }];

    this.atomTray.setContextMenu(_electron.Menu.buildFromTemplate(this.contextMenu));

    _AutoRunJs2['default'].isAutoRunning(function (isAutoRunning) {
      _this.contextMenu[0].checked = isAutoRunning;
      _this.contextMenu[0].enabled = true;
      _this.atomTray.setContextMenu(_electron.Menu.buildFromTemplate(_this.contextMenu));
    });

    _electron.ipcMain.on('BADGE_IS_ENABLED', function () {
      _this.setBadge(true);
    });

    _electron.ipcMain.on('BADGE_IS_DISABLED', function () {
      _this.setBadge(false);
    });

    this.atomTray.on('clicked', onTrayClicked);
  }

  _createClass(SystemTray, [{
    key: 'toggleRunOnStartup',
    value: function toggleRunOnStartup(menuItem) {
      if (!menuItem.checked) {
        _AutoRunJs2['default'].clear(function () {});
      } else {
        _AutoRunJs2['default'].install(function () {});
      }
    }
  }, {
    key: 'setBadge',
    value: function setBadge(enabled) {
      this.atomTray.setImage(enabled ? badgeEnabledImagePath : badgeDisableImagePath);
    }
  }, {
    key: 'displayHowToCloseHint',
    value: function displayHowToCloseHint() {
      if (!this.appSettings.get('trayBalloonShown')) {
        // todo: localize
        var balloonMessage = "Hi! Discord will run in the background to keep you in touch with your friends.\n\nYou can right-click here to quit.";
        this.appSettings.set('trayBalloonShown', true);
        this.appSettings.save();
        var res = this.atomTray.displayBalloon({
          title: 'Discord',
          content: balloonMessage
        });
      }
    }
  }]);

  return SystemTray;
})();

exports['default'] = SystemTray;
module.exports = exports['default'];