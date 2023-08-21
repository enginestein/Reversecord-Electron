'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _electron = require('electron');

var ContextMenu = (function () {
  function ContextMenu(window) {
    var _this = this;

    _classCallCheck(this, ContextMenu);

    this.window = window;

    _electron.ipcMain.on('CONTEXT_MENU', function (event, _ref) {
      var type = _ref.type;
      var x = _ref.x;
      var y = _ref.y;
      var href = _ref.href;
      var src = _ref.src;
      var value = _ref.value;
      return _this.popup(type, x, y, href, src, value);
    });
  }

  _createClass(ContextMenu, [{
    key: 'popup',
    value: function popup(type, x, y, href, src, value) {
      var menu = undefined;
      switch (type) {
        case 'input':
          menu = new _electron.Menu();
          this.addCut(menu);
          this.addCopy(menu);
          this.addPaste(menu);
          break;
        case 'image':
        case 'link':
          menu = new _electron.Menu();
          if (href != null) {
            this.addMenuItem(menu, 'Copy Link', function () {
              return _electron.clipboard.writeText(href);
            });
            this.addMenuItem(menu, 'Open Link', function () {
              return _electron.shell.openExternal(href);
            });
          }
          if (href != null && src != null) {
            this.addSeparator(menu);
          }
          if (src != null) {
            this.addMenuItem(menu, 'Copy Image URL', function () {
              return _electron.clipboard.writeText(src);
            });
          }
          break;
        case 'text':
          menu = new _electron.Menu();
          this.addCopy(menu);
          break;
      }

      if (menu != null) {
        menu.popup(this.window, x, y);
      }
    }
  }, {
    key: 'addMenuItem',
    value: function addMenuItem(menu, label, accelerator, callback) {
      if (typeof accelerator === 'function') {
        callback = accelerator;
        accelerator = null;
      }
      return menu.append(new _electron.MenuItem({ label: label, accelerator: accelerator, click: callback }));
    }
  }, {
    key: 'addCut',
    value: function addCut(menu) {
      var _this2 = this;

      this.addMenuItem(menu, 'Cut', 'CommandOrControl+X', function () {
        return _this2.window.webContents.cut();
      });
    }
  }, {
    key: 'addCopy',
    value: function addCopy(menu) {
      var _this3 = this;

      this.addMenuItem(menu, 'Copy', 'CommandOrControl+C', function () {
        return _this3.window.webContents.copy();
      });
    }
  }, {
    key: 'addPaste',
    value: function addPaste(menu) {
      var _this4 = this;

      this.addMenuItem(menu, 'Paste', 'CommandOrControl+V', function () {
        return _this4.window.webContents.paste();
      });
    }
  }, {
    key: 'addSeparator',
    value: function addSeparator(menu) {
      menu.append(new _electron.MenuItem({ type: 'separator' }));
    }
  }]);

  return ContextMenu;
})();

exports['default'] = ContextMenu;
module.exports = exports['default'];