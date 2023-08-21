'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _electron = require('electron');

var Notification = _react2['default'].createClass({
  displayName: 'Notification',

  getInitialState: function getInitialState() {
    return {
      className: 'in'
    };
  },

  handeClick: function handeClick() {
    this.props.onClick(this.props.id);
  },

  handleDismiss: function handleDismiss(e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onDismiss(this.props.id);
  },

  componentWillReceiveProps: function componentWillReceiveProps(newProps) {
    if (newProps.fadeMeOut === true) {
      this.setState({ className: 'out' });
    }
  },

  render: function render() {
    return _react2['default'].createElement(
      'div',
      { className: 'notification ' + this.state.className, onClick: this.handeClick },
      _react2['default'].createElement('button', { type: 'button', className: 'notification-dismiss', onClick: this.handleDismiss }),
      _react2['default'].createElement(
        'div',
        { className: 'notification-contents' },
        _react2['default'].createElement('div', { className: 'notification-icon', style: { backgroundImage: 'url(\'' + this.props.icon + '\')' } }),
        _react2['default'].createElement(
          'div',
          { className: 'notification-body' },
          _react2['default'].createElement(
            'header',
            null,
            this.props.title
          ),
          _react2['default'].createElement(
            'p',
            null,
            this.props.body
          )
        )
      ),
      _react2['default'].createElement('div', { className: 'notification-logo' })
    );
  }
});

var Notifications = _react2['default'].createClass({
  displayName: 'Notifications',

  getInitialState: function getInitialState() {
    return {
      notifications: []
    };
  },

  handleUpdateEvent: function handleUpdateEvent(evt, notifications) {
    this.setState({ notifications: notifications });
  },

  handleFadeOut: function handleFadeOut(evt, notificationId) {
    var notifications = this.state.notifications.map(function (n) {
      if (n.id == notificationId) {
        var notif = _extends({}, n);
        notif.fadeMeOut = true;
        return notif;
      }
      return n;
    });
    this.setState({ notifications: notifications });
  },

  componentDidMount: function componentDidMount() {
    _electron.ipcRenderer.on('UPDATE', this.handleUpdateEvent);
    _electron.ipcRenderer.on('FADE_OUT', this.handleFadeOut);
  },

  componentWillUnmount: function componentWillUnmount() {
    _electron.ipcRenderer.removeListener('UPDATE', this.handleUpdateEvent);
    _electron.ipcRenderer.removeListener('FADE_OUT', this.handleFadeOut);
  },

  handleNotificationClick: function handleNotificationClick(notificationId) {
    _electron.ipcRenderer.send('NOTIFICATION_CLICK', notificationId);
  },

  handleNotificationDismiss: function handleNotificationDismiss(notificationId) {
    _electron.ipcRenderer.send('NOTIFICATION_CLOSE', notificationId);
  },

  render: function render() {
    var _this = this;

    var notifications = this.state.notifications.map(function (notification) {
      return _react2['default'].createElement(Notification, _extends({}, notification, {
        key: notification.id,
        onClick: _this.handleNotificationClick,
        onDismiss: _this.handleNotificationDismiss }));
    });
    return _react2['default'].createElement(
      'div',
      { id: 'notifications' },
      notifications
    );
  }
});

_reactDom2['default'].render(_react2['default'].createElement(Notifications, null), document.getElementById('notifications-mount'));