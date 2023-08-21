'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _electron = require('electron');

var _mixinsIntervalMixin = require('../mixins/IntervalMixin');

var _mixinsIntervalMixin2 = _interopRequireDefault(_mixinsIntervalMixin);

var _dataQuotes_copyJson = require('../data/quotes_copy.json');

var _dataQuotes_copyJson2 = _interopRequireDefault(_dataQuotes_copyJson);

var VIDEO_REF = 'video';

var CHECKING_FOR_UPDATES = 'CHECKING_FOR_UPDATES';
var UPDATE_AVAILABLE = 'UPDATE_AVAILABLE';
var SPLASH_SCREEN_LOADING_APP_NOW = 'SPLASH_SCREEN_LOADING_APP_NOW';
var ERROR_OCCURRED_NOW_RETRYING = 'ERROR_OCCURRED_NOW_RETRYING';

var Splash = _react2['default'].createClass({
  displayName: 'Splash',

  mixins: [_mixinsIntervalMixin2['default']],

  getInitialState: function getInitialState() {
    return {
      quote: _dataQuotes_copyJson2['default'][Math.floor(Math.random() * _dataQuotes_copyJson2['default'].length)],
      videoLoaded: false,
      status: CHECKING_FOR_UPDATES,
      seconds: 0
    };
  },

  componentDidMount: function componentDidMount() {
    var _this = this;

    _reactDom2['default'].findDOMNode(this.refs[VIDEO_REF]).addEventListener('loadeddata', this.handleVideoLoaded);
    this.setInterval(1000, this.updateCountdownSeconds);
    _electron.ipcRenderer.on(CHECKING_FOR_UPDATES, function () {
      return _this.setState({ status: CHECKING_FOR_UPDATES });
    });
    _electron.ipcRenderer.on(UPDATE_AVAILABLE, function () {
      return _this.setState({ status: UPDATE_AVAILABLE });
    });
    _electron.ipcRenderer.on(SPLASH_SCREEN_LOADING_APP_NOW, function () {
      return _this.setState({ status: SPLASH_SCREEN_LOADING_APP_NOW });
    });
    _electron.ipcRenderer.on(ERROR_OCCURRED_NOW_RETRYING, function (evt, seconds) {
      return _this.setState({ status: ERROR_OCCURRED_NOW_RETRYING, seconds: seconds });
    });
    _electron.ipcRenderer.send('SPLASH_SCREEN_READY');
  },

  updateCountdownSeconds: function updateCountdownSeconds() {
    if (this.state.seconds > 0) {
      this.setState({ seconds: this.state.seconds - 1 });
    }
  },

  handleVideoLoaded: function handleVideoLoaded() {
    this.setState({ videoLoaded: true });
  },

  render: function render() {
    var statusText = undefined;
    switch (this.state.status) {
      case UPDATE_AVAILABLE:
        statusText = _react2['default'].createElement(
          'span',
          null,
          'Downloading Update'
        );
        break;
      case SPLASH_SCREEN_LOADING_APP_NOW:
        statusText = _react2['default'].createElement(
          'span',
          null,
          'Starting'
        );
        break;
      case ERROR_OCCURRED_NOW_RETRYING:
        statusText = _react2['default'].createElement(
          'span',
          null,
          'Update Failed — Retrying in ',
          this.state.seconds,
          ' sec'
        );
        break;
      case CHECKING_FOR_UPDATES:
      default:
        statusText = _react2['default'].createElement(
          'span',
          null,
          'Checking For Updates'
        );
        break;
    }

    return _react2['default'].createElement(
      'div',
      { id: 'splash' },
      _react2['default'].createElement(
        'div',
        { className: 'splash-inner' },
        _react2['default'].createElement(
          'video',
          { autoPlay: true,
            loop: true,
            ref: VIDEO_REF,
            className: this.state.videoLoaded && 'loaded' || undefined },
          _react2['default'].createElement('source', { src: '../videos/connecting.webm', type: 'video/webm' })
        ),
        _react2['default'].createElement(
          'span',
          { className: 'quote' },
          this.state.quote
        ),
        statusText
      )
    );
  }
});

_reactDom2['default'].render(_react2['default'].createElement(Splash, null), document.getElementById('splash-mount'));