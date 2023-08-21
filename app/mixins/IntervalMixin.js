"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = {
  setInterval: function setInterval(interval, callback) {
    this.clearInterval();

    this._interval = window.setInterval(callback, interval);
  },

  clearInterval: function clearInterval() {
    if (this._interval) {
      window.clearInterval(this._interval);
      this._interval = null;
    }
  },

  componentWillUnmount: function componentWillUnmount() {
    this.clearInterval();
  }
};
module.exports = exports["default"];