'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _electron = require('electron');

var SEPARATOR = { type: 'separator' };

exports['default'] = [{
  label: 'Discord',
  submenu: [{
    label: 'About Discord',
    selector: 'orderFrontStandardAboutPanel:'
  }, {
    label: 'Check for Updates...',
    click: function click() {
      return _electron.app.emit('menu:check-for-updates');
    }
  }, SEPARATOR, {
    label: 'Preferences',
    click: function click() {
      return _electron.app.emit('menu:open-settings');
    },
    accelerator: 'Command+,'
  }, SEPARATOR, {
    label: 'Services',
    submenu: []
  }, SEPARATOR, {
    label: 'Hide Discord',
    selector: 'hide:',
    accelerator: 'Command+H'
  }, {
    label: 'Hide Others',
    selector: 'hideOtherApplications:',
    accelerator: 'Command+Alt+H'
  }, {
    label: 'Show All',
    selector: 'unhideAllApplications:'
  }, SEPARATOR, {
    label: 'Quit',
    click: function click() {
      return _electron.app.quit();
    },
    accelerator: 'Command+Q'
  }]
}, {
  label: 'Edit',
  submenu: [{
    label: 'Undo',
    selector: 'undo:',
    accelerator: 'Command+Z'
  }, {
    label: 'Redo',
    selector: 'redo:',
    accelerator: 'Shift+Command+Z'
  }, SEPARATOR, {
    label: 'Cut',
    selector: 'cut:',
    accelerator: 'Command+X'
  }, {
    label: 'Copy',
    selector: 'copy:',
    accelerator: 'Command+C'
  }, {
    label: 'Paste',
    selector: 'paste:',
    accelerator: 'Command+V'
  }, {
    label: 'Select All',
    selector: 'selectAll:',
    accelerator: 'Command+A'
  }]
}, {
  label: 'View',
  submenu: [{
    label: 'Reload',
    click: function click() {
      return _electron.BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache();
    },
    accelerator: 'Command+R'
  }, {
    label: 'Toggle Full Screen',
    click: function click() {
      return _electron.BrowserWindow.getFocusedWindow().setFullScreen(!_electron.BrowserWindow.getFocusedWindow().isFullScreen());
    },
    accelerator: 'Command+Control+F'
  }, SEPARATOR, {
    label: 'Developer',
    submenu: [{
      label: 'Toggle Developer Tools',
      click: function click() {
        return _electron.BrowserWindow.getFocusedWindow().toggleDevTools();
      },
      accelerator: 'Alt+Command+I'
    }]
  }]
}, {
  label: 'Window',
  submenu: [{
    label: 'Minimize',
    selector: 'performMiniaturize:',
    accelerator: 'Command+M'
  }, {
    label: 'Zoom',
    selector: 'performZoom:'
  }, {
    label: 'Close',
    accelerator: 'Command+W',
    selector: 'hide:'
  }, SEPARATOR, {
    label: 'Bring All to Front',
    selector: 'arrangeInFront:'
  }]
}, {
  label: 'Help',
  submenu: [{
    label: 'Discord Help',
    click: function click() {
      return _electron.app.emit('menu:open-help');
    }
  }]
}];
module.exports = exports['default'];