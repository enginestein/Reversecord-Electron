'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _electron = require('electron');

var SEPARATOR = { type: 'separator' };
var NOOP = function NOOP() {};

function webContentsCallback(fn) {
  var win = _electron.BrowserWindow.getFocusedWindow();
  if (!win) {
    return NOOP;
  }
  var f = win.webContents[fn];
  if (f) {
    return f;
  } else {
    console.warn('no', fn);
    return NOOP;
  }
}

exports['default'] = [{
  label: '&File',
  submenu: [{
    label: '&Options',
    click: function click() {
      return _electron.app.emit('menu:open-settings');
    },
    accelerator: 'Ctrl+,'
  }, SEPARATOR, {
    label: 'E&xit',
    click: function click() {
      return _electron.app.quit();
    },
    accelerator: 'Alt+F4'
  }]
}, {
  label: '&Edit',
  submenu: [{
    label: '&Undo',
    click: webContentsCallback('undo'),
    accelerator: 'Control+Z'
  }, {
    label: '&Redo',
    click: webContentsCallback('redo'),
    accelerator: 'Control+Y'
  }, SEPARATOR, {
    label: '&Cut',
    click: webContentsCallback('cut'),
    accelerator: 'Control+X'
  }, {
    label: 'C&opy',
    click: webContentsCallback('copy'),
    accelerator: 'Control+C'
  }, {
    label: '&Paste',
    click: webContentsCallback('paste'),
    accelerator: 'Control+V'
  }, {
    label: 'Select &All',
    click: webContentsCallback('selectAll'),
    accelerator: 'Control+A'
  }]
}, {
  label: '&View',
  submenu: [{
    label: '&Reload',
    click: function click() {
      return _electron.BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
    },
    accelerator: 'Control+R'
  }, {
    label: 'Toggle &Full Screen',
    click: function click() {
      return _electron.BrowserWindow.getFocusedWindow().setFullScreen(!_electron.BrowserWindow.getFocusedWindow().isFullScreen());
    },
    accelerator: 'Control+Shift+F'
  }, SEPARATOR, {
    label: '&Developer',
    submenu: [{
      label: 'Toggle Developer &Tools',
      click: function click() {
        return _electron.BrowserWindow.getFocusedWindow().toggleDevTools();
      },
      accelerator: 'Control+Shift+I'
    }]
  }]
}, {
  label: '&Help',
  submenu: [{
    label: 'Check for Updates...',
    click: function click() {
      return _electron.app.emit('menu:check-for-updates');
    }
  }, SEPARATOR, {
    label: 'Discord Help',
    click: function click() {
      return _electron.app.emit('menu:open-help');
    }
  }]
}];
module.exports = exports['default'];