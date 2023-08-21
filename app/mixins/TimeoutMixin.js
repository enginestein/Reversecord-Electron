"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = {

  setTimeout: function setTimeout(timeout, callback) {
    this.clearTimeout();

    this._timeout = window.setTimeout(callback, timeout);
  },

  clearTimeout: function clearTimeout() {
    if (this._timeout) {
      window.clearTimeout(this._timeout);
      this._timeout = null;
    }
  },

  componentWillUnmount: function componentWillUnmount() {
    this.clearTimeout();
  }
};
module.exports = exports["default"];