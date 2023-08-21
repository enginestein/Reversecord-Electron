import NativeUtils from '../../utils/NativeUtils';
import platform from 'platform';

navigator.getUserMedia = navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;
window.AudioContext = window.AudioContext ||
  window.webkitAudioContext ||
  navigator.mozAudioContext;
window.RTCPeerConnection = window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection;
window.RTCSessionDescription = window.RTCSessionDescription ||
  window.mozRTCSessionDescription ||
  window.webkitRTCSessionDescription;

function noop() {}

let VoiceEngine = {
  supported: false,
  autoEnable: false,
  enable: noop,
  playSound: noop,
  supportsMultiplePTT: noop,
  setForceSend: noop,
  setInputMode: noop,
  setInputVolume: noop,
  setOutputVolume: noop,
  setVolumeChangeCallback: noop,
  setOnSpeakingCallback: noop,
  setOnVoiceCallback: noop,
  setOnInputEventCallback: noop,
  setSelfMute: noop,
  setSelfDeaf: noop,
  setLocalMute: noop,
  setLocalVolume: noop,
  createUser: noop,
  destroyUser: noop,
  onSpeaking: noop,
  onVoiceActivity: noop,
  onDevicesChanged: noop,
  onConnectionState: noop,
  getInputDevices: noop,
  getOutputDevices: noop,
  setInputDevice: noop,
  setOutputDevice: noop,
  canSetInputDevice: () => false,
  canSetOutputDevice: () => false,
  setEncodingBitRate: noop,
  supportsEncodingBitRate: () => false,
  setEchoCancellation: noop,
  setNoiseSuppression: noop,
  setAutomaticGainControl: noop,
  setAttenuation: noop,
  supportsAutomaticVAD: () => false,
  isAttenuationEnabled: () => false,
  canSetAttenuation: () => false,
  canSetVoiceProcessing: () => false,
  connect: noop,
  disconnect: noop,
  handleSpeaking: noop,
  handleSessionDescription: noop,
  inputEventRegister: noop,
  inputEventUnregister: noop,
  debugDump: () => {},
  setNoInputCallback: noop,
  setNoInputThreshold: noop,
  collectDiagnostics: callback => callback(null),
  runDiagnostics: callback => callback(null),
  getDiagnosticInfo: noop,
  diagnosticsEnabled: false,
  Constants: {},
  supportsNativePing: false,
  setPingCallback: null
};

if (__OVERLAY__) {
  VoiceEngine.supported = true;
  VoiceEngine.autoEnable = true;
}
else if (NativeUtils.embedded) {
  VoiceEngine = require('./native');
}
else if (window.AudioContext && navigator.getUserMedia && window.RTCPeerConnection) {
  const SUPPORTED_BROWSERS = {
    firefox: 38,
    chrome: 37,
    opera: 27
  };

  for (let browser of Object.keys(SUPPORTED_BROWSERS)) {
    const version = SUPPORTED_BROWSERS[browser];
    if (platform.name.toLowerCase() === browser && parseInt(platform.version) >= version) {
      VoiceEngine = require('./webrtc');
      break;
    }
  }
}

export default VoiceEngine;



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/index.js
 **/