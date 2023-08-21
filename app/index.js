'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _crashReporter = require('crash-reporter');

var _crashReporter2 = _interopRequireDefault(_crashReporter);

var _electron = require('electron');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _AppSettings = require('./AppSettings');

var _AppSettings2 = _interopRequireDefault(_AppSettings);

var _ContextMenu = require('./ContextMenu');

var _ContextMenu2 = _interopRequireDefault(_ContextMenu);

var _NotificationWindow = require('./NotificationWindow');

var _NotificationWindow2 = _interopRequireDefault(_NotificationWindow);

var _SplashWindow = require('./SplashWindow');

var _SplashWindow2 = _interopRequireDefault(_SplashWindow);

var _SystemTray = require('./SystemTray');

var _SystemTray2 = _interopRequireDefault(_SystemTray);

//var _Utils = require('./Utils');

//var _Utils2 = _interopRequireDefault(_Utils);

var _VoiceEngine = require('./VoiceEngine');

var _VoiceEngine2 = _interopRequireDefault(_VoiceEngine);

var _menu = require('./menu');

var _menu2 = _interopRequireDefault(_menu);

var _AutoUpdater = require('./AutoUpdater');

var _AutoUpdater2 = _interopRequireDefault(_AutoUpdater);

var _singleInstance = require('./singleInstance');

var _singleInstance2 = _interopRequireDefault(_singleInstance);

var APP_ID_BASE = 'com.squirrel.';
var DEFAULT_WIDTH = 1280;
var DEFAULT_HEIGHT = 720;
var MIN_WIDTH = 64;
var MIN_HEIGHT = 64;
var MIN_VISIBLE_ON_SCREEN = 32;
var ACCOUNT_GREY = '#282b30';

_crashReporter2['default'].start({
  productName: 'Discord',
  companyName: 'Hammer & Chisel, Inc.',
  submitURL: 'http://crash.discordapp.com:1127/post',
  autoSubmit: true,
  ignoreSystemCrashHandler: false
});

// citron note: bai bai for now.
//app.commandLine.appendSwitch('in-process-gpu');

global.mainWindowId = 0;
global.mainAppDirname = __dirname;

var mainWindow = null;
var notificationWindow = null;
var contextMenu = null;
var systemTray = null;
var appSettings = new _AppSettings2['default']();
var splashWindow = null;
var releaseChannel = '';
var configPath = '';
var configModifiedTime = null;
var config = {};
var lastConfigStr = '';

function dirExists(fname) {
  try {
    var tempStat = _fs2['default'].statSync(fname);
    return tempStat.isDirectory();
  } catch (e) {}
  return false;
}

function fileExists(fname) {
  try {
    var tempStat = _fs2['default'].statSync(fname);
    return tempStat.isFile();
  } catch (e) {}
  return false;
}

function setupContextMenu(mainWindow) {
  if (!contextMenu) {
    contextMenu = new _ContextMenu2['default'](mainWindow);
  }
  contextMenu.window = mainWindow;
}

function setupNotificationWindow(mainWindow, appID) {
  if (!notificationWindow) {
    notificationWindow = new _NotificationWindow2['default'](mainWindow, {
      title: 'Discord Notifications',
      maxVisible: 5,
      screenPosition: 'bottom',
      appID: appID
    });

    notificationWindow.on('notification-click', function () {
      setWindowVisible(true, true);
    });
  }
  notificationWindow.mainWindow = mainWindow;
}

function setupSystemTray() {
  if (!systemTray) {
    systemTray = new _SystemTray2['default'](function () {
      return _AutoUpdater2['default'].checkForUpdates();
    }, function () {
      return _electron.app.quit();
    }, function () {
      return setWindowVisible(true, true);
    }, appSettings);
  }
}

function getUserHome() {
  return _electron.app.getPath('userData');
}

function getConfigFileModifiedTime() {
  try {
    return _fs2['default'].statSync(configPath).mtime.getTime();
  } catch (e) {
    return 0;
  }
}

function saveConfig() {
  var configStr = JSON.stringify(config, null, 2);
  if (lastConfigStr == configStr) {
    return;
  }
  if (configModifiedTime) {
    var newConfigMTime = getConfigFileModifiedTime();
    if (configModifiedTime != newConfigMTime) {
      console.warn("Not saving config, it was externally modified.");
      return;
    }
  }
  lastConfigStr = configStr;
  _fs2['default'].writeFileSync(configPath, configStr);
  configModifiedTime = getConfigFileModifiedTime();
}

function loadConfig() {
  configPath = _path2['default'].join(getUserHome(), 'discord_' + releaseChannel + '.json');
  configModifiedTime = getConfigFileModifiedTime();

  try {
    var configStr = _fs2['default'].readFileSync(configPath);
    config = JSON.parse(configStr);
    lastConfigStr = configStr;
  } catch (e) {
    config = {};
    saveConfig();
  }
}

function saveWindowConfig(browserWindow) {
  try {
    if (!browserWindow) {
      return;
    }

    config.IS_MAXIMIZED = browserWindow.isMaximized();
    config.IS_MINIMIZED = browserWindow.isMinimized();
    if (!config.IS_MAXIMIZED && !config.IS_MINIMIZED) {
      config.WINDOW_BOUNDS = browserWindow.getBounds();
    }

    saveConfig();
  } catch (e) {
    console.error(e);
  }
}

function doAABBsOverlap(a, b) {
  var ax1 = a.x + a.width;
  var bx1 = b.x + b.width;
  var ay1 = a.y + a.height;
  var by1 = b.y + b.height;
  // clamp a to b, see if it is non-empty
  var cx0 = a.x < b.x ? b.x : a.x;
  var cx1 = ax1 < bx1 ? ax1 : bx1;
  if (cx1 - cx0 > 0) {
    var cy0 = a.y < b.y ? b.y : a.y;
    var cy1 = ay1 < by1 ? ay1 : by1;
    if (cy1 - cy0 > 0) {
      return true;
    }
  }
  return false;
}

function loadWindowConfig(mainWindowOptions) {
  if (config.WINDOW_BOUNDS === undefined) {
    mainWindowOptions.center = true;
    return;
  }

  if (config.WINDOW_BOUNDS.width < MIN_WIDTH) {
    config.WINDOW_BOUNDS.width = MIN_WIDTH;
  }

  if (config.WINDOW_BOUNDS.height < MIN_HEIGHT) {
    config.WINDOW_BOUNDS.height = MIN_HEIGHT;
  }

  var isVisibleOnAnyScreen = false;
  var screen = require('screen');
  var displays = screen.getAllDisplays();
  displays.forEach(function (display) {
    if (isVisibleOnAnyScreen) {
      return;
    }
    var displayBound = display.workArea;
    displayBound.x += MIN_VISIBLE_ON_SCREEN;
    displayBound.y += MIN_VISIBLE_ON_SCREEN;
    displayBound.width -= 2 * MIN_VISIBLE_ON_SCREEN;
    displayBound.height -= 2 * MIN_VISIBLE_ON_SCREEN;
    isVisibleOnAnyScreen = doAABBsOverlap(config.WINDOW_BOUNDS, displayBound);
  });

  if (isVisibleOnAnyScreen) {
    mainWindowOptions.width = config.WINDOW_BOUNDS.width;
    mainWindowOptions.height = config.WINDOW_BOUNDS.height;
    mainWindowOptions.x = config.WINDOW_BOUNDS.x;
    mainWindowOptions.y = config.WINDOW_BOUNDS.y;
  } else {
    mainWindowOptions.center = true;
  }
}

function webContentsSend() {
  if (mainWindow != null && mainWindow.webContents != null) {
    var _mainWindow$webContents;

    (_mainWindow$webContents = mainWindow.webContents).send.apply(_mainWindow$webContents, arguments);
  }
}

function extractPath(args, fallbackPath) {
  if (args[0] === '--url') {
    var parsedURL = _url2['default'].parse(args[1]);
    if (parsedURL.protocol === 'discord:') {
      return parsedURL.path;
    }
  }
  return fallbackPath;
}

function setWindowVisible(isVisible, andUnminimize) {
  if (mainWindow == null) {
    return;
  }

  if (isVisible) {
    if (andUnminimize || !mainWindow.isMinimized()) {
      mainWindow.show();
      webContentsSend('MAIN_WINDOW_FOCUS');
    }
  } else {
    webContentsSend('MAIN_WINDOW_BLUR');
    mainWindow.hide();
    if (systemTray) {
      systemTray.displayHowToCloseHint();
    }
  }

  mainWindow.setSkipTaskbar(!isVisible);
}

function capitalizeFirstLetter(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function main() {
  releaseChannel = _singleInstance2['default'].releaseChannel;
  console.log('Using update channel \'' + releaseChannel + '\'');
  var appName = 'Discord' + (releaseChannel == 'stable' ? '' : capitalizeFirstLetter(releaseChannel));
  var appID = APP_ID_BASE + appName + '.' + appName;

  if (process.platform === 'win32') {
    // this tells Windows (in particular Windows 10) which icon to associate your app with, important for correctly
    // pinning app to task bar.
    _electron.app.setAppUserModelId(appID);

    var _require = require('./SquirrelUpdate');

    var handleStartupEvent = _require.handleStartupEvent;

    var squirrelCommand = process.argv[1];
    if (handleStartupEvent('Discord', _electron.app, squirrelCommand)) {
      return;
    }
  }

  loadConfig();

  var API_ENDPOINT = config.API_ENDPOINT || 'https://discordapp.com/api';
  var WEBAPP_ENDPOINT = config.WEBAPP_ENDPOINT || (_singleInstance2['default'].releaseChannel === 'stable' ? 'https://discordapp.com' : 'https://' + _singleInstance2['default'].releaseChannel + '.discordapp.com');
  var UPDATE_ENDPOINT = config.UPDATE_ENDPOINT || API_ENDPOINT;

  var appPath = extractPath(process.argv.slice(1), '/channels/@me');

  if (_AutoUpdater2['default'] != null) {
    (function () {
      var autoUpdaterState = 'UPDATE_NOT_AVAILABLE';
      _AutoUpdater2['default'].on('checking-for-update', function () {
        autoUpdaterState = 'CHECKING_FOR_UPDATES';
        webContentsSend(autoUpdaterState);
      });
      _AutoUpdater2['default'].on('update-not-available', function () {
        autoUpdaterState = 'UPDATE_NOT_AVAILABLE';
        webContentsSend(autoUpdaterState);
      });
      _AutoUpdater2['default'].on('update-available', function () {
        autoUpdaterState = 'UPDATE_AVAILABLE';
        webContentsSend(autoUpdaterState);
      });
      _AutoUpdater2['default'].on('error', function (event, message) {
        autoUpdaterState = 'UPDATE_NOT_AVAILABLE';
        webContentsSend('UPDATE_ERROR', message);
      });
      _AutoUpdater2['default'].on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl) {
        autoUpdaterState = 'UPDATE_DOWNLOADED';
        webContentsSend(autoUpdaterState, releaseNotes, releaseName, releaseDate, updateUrl);
      });

      switch (process.platform) {
        case 'darwin':
          _AutoUpdater2['default'].setFeedURL(UPDATE_ENDPOINT + '/updates/' + releaseChannel + '?version=' + _electron.app.getVersion());
          break;
        case 'win32':
          // Squirrel for Windows can't handle query params
          // https://github.com/Squirrel/Squirrel.Windows/issues/132
          _AutoUpdater2['default'].setFeedURL(UPDATE_ENDPOINT + '/updates/' + releaseChannel);
          break;
      }

      _electron.ipcMain.on('CHECK_FOR_UPDATES', function (event, arg) {
        if (autoUpdaterState === 'UPDATE_NOT_AVAILABLE') {
          _AutoUpdater2['default'].checkForUpdates();
        } else {
          webContentsSend(autoUpdaterState);
        }
      });
      _electron.ipcMain.on('QUIT_AND_INSTALL', function (event, arg) {
        saveWindowConfig(mainWindow);
        mainWindow = null;
        _AutoUpdater2['default'].quitAndInstall();
      });
    })();
  }

  _electron.app.on('open-url', function (event, openURL) {
    var parsedURL = _url2['default'].parse(openURL);
    if (parsedURL.protocol === 'discord:') {
      if (mainWindow == null) {
        appPath = parsedURL.path;
      } else {
        webContentsSend('PATH', parsedURL.path);
      }
    } else if (parsedURL.protocol === 'steam:') {
      _electron.shell.openExternal(openURL);
    }
  });

  _electron.app.on('menu:open-help', function () {
    return webContentsSend('HELP_OPEN');
  });
  _electron.app.on('menu:open-settings', function () {
    return webContentsSend('USER_SETTINGS_OPEN');
  });
  _electron.app.on('menu:check-for-updates', function () {
    return _AutoUpdater2['default'].checkForUpdates();
  });

  _electron.app.on('before-quit', function (e) {
    saveWindowConfig(mainWindow);
    mainWindow = null;
    contextMenu = null;
    if (notificationWindow != null) {
      notificationWindow.close();
    }
  });

  function launchMainAppWindow(isVisible) {
    // want to be able to re-run this and set things up again
    if (mainWindow) {
      // message here?
      mainWindow.destroy();
    }

    var mainWindowOptions = {
      title: "Discord",
      backgroundColor: ACCOUNT_GREY,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      'min-width': MIN_WIDTH,
      'min-height': MIN_HEIGHT,
      transparent: false,
      frame: false,
      resizable: true,
      show: isVisible,
      webPreferences: {
        blinkFeatures: "EnumerateDevices,AudioOutputDevices",
        webSecurity: false,
        preload: require('path').join(__dirname, 'preload.js')
      }
    };

    loadWindowConfig(mainWindowOptions);

    mainWindow = new _electron.BrowserWindow(mainWindowOptions);
    global.mainWindowId = mainWindow.id;

    if (config.IS_MAXIMIZED) {
      mainWindow.maximize();
    }

    if (config.IS_MINIMIZED) {
      mainWindow.minimize();
    }

    mainWindow.webContents.on('new-window', function (e, windowURL) {
      e.preventDefault();
      _electron.shell.openExternal(windowURL);
    });

    mainWindow.webContents.on('did-fail-load', function (e, errCode, errDesc) {
      console.error("did-fail-load", e, errCode, errDesc);
    });

    //mainWindow.webContents.on('did-start-loading', function() {
    //  mainWindow.webContents.executeJavaScript("console.log(window.webpackJsonp); window['webpackJsonp'] = console.log.bind(console, 'parent webpack:')");
    //});

    mainWindow.webContents.on('crashed', function () {
      console.error("crashed... reloading");
      launchMainAppWindow(true);
    });

    // This breaks logout
    //mainWindow.webContents.on('will-navigate', (evt, url) => {
    //  evt.preventDefault();
    //});

    mainWindow.on('focus', function () {
      //_Utils2['default'].setFocused(true);
      webContentsSend('MAIN_WINDOW_FOCUS');
    });

    mainWindow.on('blur', function () {
      //_Utils2['default'].setFocused(false);
      // invoking Utils.purgeMemory() purges in the main process, and
      // webContentsSend() instructs the renderer processes to do the
      // same
      //_Utils2['default'].purgeMemory();
      //webContentsSend('PURGE_MEMORY');
      webContentsSend('MAIN_WINDOW_BLUR');
    });

    if (process.platform === 'win32') {
      setupNotificationWindow(mainWindow, appID);
      setupSystemTray();

      mainWindow.on('close', function (e) {
        if (mainWindow === null) {
          // this means we're quitting
          return;
        }
        saveWindowConfig(mainWindow);
        //_Utils2['default'].setFocused(false);
        setWindowVisible(false);
        e.preventDefault();
      });
    }

    setupContextMenu(mainWindow);

    //_Utils2['default'].setFocused(mainWindow.isFocused());

    mainWindow.loadURL('' + WEBAPP_ENDPOINT + appPath + '?_=' + Date.now());
  }

  _electron.app.on('ready', function () {
    global.VoiceEngine = _VoiceEngine2['default'];

    _electron.Menu.setApplicationMenu(_menu2['default']);

    _singleInstance2['default'].create(function () {
      if (_AutoUpdater2['default'] != null) {
        var suppressAutoUpdate = config.AUTO_UPDATE === false || _electron.app.getVersion() === '0.0.0';
        splashWindow = new _SplashWindow2['default'](suppressAutoUpdate);
        splashWindow.once(_SplashWindow2['default'].EVENT_APP_SHOULD_LAUNCH, function () {
          return launchMainAppWindow(false);
        });
        splashWindow.once(_SplashWindow2['default'].EVENT_APP_SHOULD_SHOW, function () {
          return setWindowVisible(true);
        });
      } else {
        launchMainAppWindow(true);
      }
    }, function (args) {
      if (args != null && args.length > 0 && args[0] === '--squirrel-uninstall') {
        _electron.app.quit();
        return;
      }

      if (mainWindow != null) {
        appPath = extractPath(args);
        if (appPath != null) {
          webContentsSend('PATH', appPath);
        }
        setWindowVisible(true, false);
        mainWindow.focus();
      } else if (splashWindow != null) {
        splashWindow.focus();
      }
    });
  });
}

main();
