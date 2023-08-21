'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _electron = require('electron');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var AppSettings = (function () {
  function AppSettings() {
    _classCallCheck(this, AppSettings);

    this.filePath = _path2['default'].join(_electron.app.getPath('userData'), 'settings.json');

    if (!_fs2['default'].existsSync(this.filePath)) {
      this.settings = {};
    } else {
      var data = _fs2['default'].readFileSync(this.filePath);
      try {
        this.settings = JSON.parse(data);
      } catch (err) {
        this.settings = {};
      }
    }
  }

  _createClass(AppSettings, [{
    key: 'get',
    value: function get(key) {
      if (this.settings.hasOwnProperty(key)) {
        return this.settings[key];
      }

      return false;
    }
  }, {
    key: 'set',
    value: function set(key, value) {
      this.settings[key] = value;
    }
  }, {
    key: 'save',
    value: function save() {
      try {
        _fs2['default'].writeFile(this.filePath, JSON.stringify(this.settings));
      } catch (err) {
        console.log('Failed saving settings file with error');
        console.log(err);
      }
    }
  }]);

  return AppSettings;
})();

exports['default'] = AppSettings;
module.exports = exports['default'];