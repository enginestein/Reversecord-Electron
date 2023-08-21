import NativeUtils from '../../../utils/NativeUtils';
import versionGuard from '../../VersionGuard';
import i18n from '../../../i18n';
import GlobalShortcut from '../../GlobalShortcut';
import {InputModes, VoiceConnectionStates, ProcessPriority} from '../../../Constants';
import Logger from '../../Logger';
import path from 'path';

import {
  EchoCancellation,
  AECMobile,
  AutomaticGainControl,
  NoiseSuppression,
  VADAggressiveness,
  NATIVE_MODE_VALUES
} from './Constants';

const VoiceEngine = NativeUtils.getVoiceEngine();

const logger = Logger.create('VoiceEngine');

// citron note: this will be replaced with a VoiceEngine version
let VERSION_REQ_FULL_PATH_SOUNDS = false;
let VERSION_REQ_PTT_RELEASE_DELAY = false;
let VERSION_REQ_AUTOMATIC_VAD = false;
if (NativeUtils.isWindows() || NativeUtils.isOSX()) {
  VERSION_REQ_FULL_PATH_SOUNDS = NativeUtils.isVersionEqualOrNewer({
    'stable': ['0.0.275', '0.0.218'],
    'canary': ['0.0.41', '0.0.47'],
    'ptb': ['0.0.1', '0.0.1']
  });
  VERSION_REQ_PTT_RELEASE_DELAY = NativeUtils.isVersionEqualOrNewer({
    'stable': ['0.0.278', '0.0.229'],
    'canary': ['0.0.67', '0.0.58'],
    'ptb': ['0.0.1', '0.0.1']
  });
  VERSION_REQ_AUTOMATIC_VAD = NativeUtils.isVersionEqualOrNewer({
    'stable': ['0.0.239', '0.0.231'],
    'canary': ['0.0.73', '0.0.62'],
    'ptb': ['0.0.1', '0.0.1']
  });
}

const DEFAULT_VOLUME = 100;

let connectionState = VoiceConnectionStates.VOICE_DISCONNECTED;
let hasTransport = false;
let selfMute = false;
let inputVolume = DEFAULT_VOLUME;
let outputVolume = DEFAULT_VOLUME;
let inputDeviceIndex = 0;
let outputDeviceIndex = 0;
let localMutes = {};
let localVolumes = {};
let remoteSSRCs = {};
let encryptionSettings = null;
let onSpeaking = () => null;
let onDevicesChanged = null;
let onConnectionState = null;
let onVoiceActivity = null;
let inputMode = InputModes.VOICE_ACTIVITY;
let vadThreshold = -40;
let vadAutoThreshold = true;
let pttShortcut;
let pttDelay = 0;
let echoCancellation = EchoCancellation.CONFERANCE;
let noiseSuppression = NoiseSuppression.HIGH_SUPPRESSION;
let automaticGainControl = AutomaticGainControl.ADAPTIVE_ANALOG;
let attenuationFactor = 0.5;

// setOnSpeakingCallback
function onUserSpeaking(userId, speaking) {
  onSpeaking(userId, speaking);
}
if (VoiceEngine.setOnSpeakingCallback) {
  VoiceEngine.setOnSpeakingCallback(NativeUtils.makeDeferred(onUserSpeaking, false));
}
else {
  NativeUtils.on('user-speaking', ({isSpeaking, userId}) => onUserSpeaking(userId, isSpeaking));
}

// setOnVoiceCallback
let lastOnVoice;
function onVoice(level) {
  if (onVoiceActivity != null) {
    const now = Date.now();
    if (lastOnVoice == null || Date.now() - lastOnVoice > 20) {
      lastOnVoice = now;
      onVoiceActivity(level);
    }
  }
}
if (VoiceEngine.setOnVoiceCallback) {
  VoiceEngine.setOnVoiceCallback(NativeUtils.makeDeferred(onVoice));
}
else {
  NativeUtils.on('on-voice', ({level}) => onVoice(level));
}

// setDeviceChangeCallback
function onDeviceChange(inputDevices, outputDevices) {
  onDevicesChanged && onDevicesChanged(inputDevices, outputDevices);
}
if (VoiceEngine.setDeviceChangeCallback) {
  VoiceEngine.setDeviceChangeCallback(NativeUtils.makeDeferred(onDeviceChange));
}
else {
  NativeUtils.on('device-changed', ({inputDevices, outputDevices}) => onDeviceChange(inputDevices, outputDevices));
}

VoiceEngine.setEmitVADLevel(false);

function getLocalVolume(userId) {
  const volume = localVolumes[userId];
  return (volume != null ? volume : DEFAULT_VOLUME) / DEFAULT_VOLUME;
}

function getLocalMute(userId) {
  return localMutes[userId] || false;
}

function createInputModeOptions() {
  if (inputMode === InputModes.VOICE_ACTIVITY) {
    return {
      vadThreshold,
      vadAutoThreshold: vadAutoThreshold ? VADAggressiveness.VERY_AGGRESSIVE : -1,
      vadLeading: 5,
      vadTrailing: 25
    };
  }
  else if (inputMode === InputModes.PUSH_TO_TALK) {
    return {
      pttScanCodeCombos: pttShortcut || [],
      pttReleaseDelay: pttDelay
    };
  }

  return {};
}

function sanitizeDevices(devices) {
  devices = devices.map(({index, guid, name, name: originalName}) => {
    if (/^default/.test(name)) {
      guid = 'default';
      name = i18n.Messages.DEFAULT;
    }
    guid = guid || name;
    return {id: guid, index, name, originalName};
  });
  if (NativeUtils.isWindows()) {
    devices.unshift({id: 'default', index: -1, name: i18n.Messages.DEFAULT});
  }
  return devices;
}

function setConnectionState(state) {
  connectionState = state;
  onConnectionState && onConnectionState(state);
}

function isAttenuating() {
  return attenuationFactor < 1;
}

function getTransportOptions(includeEncryptionSettings = false) {
  const transportOptions = {
    builtInEchoCancellation: true,
    echoCancellation: echoCancellation,
    noiseSuppression: noiseSuppression,
    automaticGainControl: automaticGainControl,
    inputDevice: inputDeviceIndex,
    outputDevice: outputDeviceIndex,
    inputVolume: inputVolume / DEFAULT_VOLUME,
    outputVolume: outputVolume / DEFAULT_VOLUME,
    inputMode: NATIVE_MODE_VALUES[inputMode],
    inputModeOptions: createInputModeOptions(),
    selfMute: selfMute,
    attenuation: isAttenuating(),
    attenuationFactor: attenuationFactor,
    ducking: false
  };

  if (includeEncryptionSettings) {
    transportOptions.encryptionSettings = encryptionSettings;
  }

  return transportOptions;
}

function getUserOptions() {
  return Object.keys(remoteSSRCs).map(userId => ({
    id: userId,
    ssrc: remoteSSRCs[userId],
    mute: getLocalMute(userId),
    volume: getLocalVolume(userId)
  }));
}

function createTransport(ssrc, userId, address, port, callback) {
  if (hasTransport) {
    logger.warn('Transport already exists');
  }

  NativeUtils.setProcessPriority(ProcessPriority.HIGH);
  setConnectionState(VoiceConnectionStates.VOICE_CONNECTING);

  logger.info('createTransport', ssrc, userId, address, port);
  VoiceEngine.createTransport(ssrc, userId, address, port, NativeUtils.makeDeferred((err, transportInfo) => {
    if (err != null && err !== '') {
      setConnectionState(VoiceConnectionStates.NO_ROUTE);
      callback(err);
      return;
    }

    setConnectionState(VoiceConnectionStates.VOICE_CONNECTED);
    if (typeof transportInfo === 'object') {
      callback(null, transportInfo['protocol'], {
        address: transportInfo['address'],
        port: transportInfo['port'],
        mode: 'xsalsa20_poly1305'
      });
    }
    else {
      callback(null, transportInfo /* protocol */, arguments[2] /* port */);
    }

    const transportOptions = getTransportOptions();
    logger.info('setTransportOptions', transportOptions);
    VoiceEngine.setTransportOptions(transportOptions);

    const users = getUserOptions();
    logger.info('mergeUsers', users);
    VoiceEngine.mergeUsers(users);
  }));

  hasTransport = true;
}

function destroyTransport() {
  logger.info('deleteTransport');
  VoiceEngine.destroyTransport();

  NativeUtils.setProcessPriority(ProcessPriority.NORMAL);
  setConnectionState(VoiceConnectionStates.VOICE_DISCONNECTED);

  hasTransport = false;
}

function noop() {
}

const inputDetectionVersionGuard = versionGuard({
  'stable': ['0.0.284', '0.0.234'],
  'canary': ['0.0.87', '0.0.73'],
  'ptb': ['0.0.1', '0.0.1']
});

export default {
  supported: true,

  autoEnable: true,

  enable: noop,

  setInputMode(mode, {shortcut, threshold, autoThreshold, delay}) {
    inputMode = mode;
    vadThreshold = threshold;
    vadAutoThreshold = autoThreshold;
    pttShortcut = shortcut;
    pttDelay = delay;
    VoiceEngine.setInputMode(NATIVE_MODE_VALUES[inputMode], createInputModeOptions());
  },

  setInputVolume(volume) {
    inputVolume = volume;
    VoiceEngine.setInputVolume(inputVolume / DEFAULT_VOLUME);
  },

  setOutputVolume(volume) {
    outputVolume = volume;
    VoiceEngine.setOutputVolume(outputVolume / DEFAULT_VOLUME);
  },

  setVolumeChangeCallback(callback) {
    if (VoiceEngine.setVolumeChangeCallback) {
      VoiceEngine.setVolumeChangeCallback(NativeUtils.makeDeferred((inVol01, outVol01) => {
        callback(inVol01 * DEFAULT_VOLUME, outVol01 * DEFAULT_VOLUME);
      }));
    }
  },

  setSelfMute(mute) {
    selfMute = mute;
    if (hasTransport) {
      VoiceEngine.setSelfMute(selfMute);
    }
  },

  setSelfDeaf(deaf) {
    VoiceEngine.setSelfDeafen(deaf);
  },

  setLocalMute(userId, mute) {
    localMutes[userId] = mute;
    if (hasTransport) {
      VoiceEngine.setLocalMute(userId, mute);
    }
  },

  setLocalVolume(userId, volume) {
    localVolumes[userId] = volume;
    if (hasTransport) {
      VoiceEngine.setLocalVolume(userId, getLocalVolume(userId));
    }
  },

  createUser(userId, ssrc) {
    if (hasTransport && remoteSSRCs[userId] !== ssrc) {
      const user = {
        id: userId,
        ssrc: ssrc,
        mute: getLocalMute(userId),
        volume: getLocalVolume(userId)
      };
      logger.info('mergeUsers', [user]);
      VoiceEngine.mergeUsers([user]);
    }
    remoteSSRCs[userId] = ssrc;
  },

  destroyUser(userId) {
    if (hasTransport) {
      logger.info('destroyUser', userId);
      VoiceEngine.destroyUser(userId);
    }
    delete remoteSSRCs[userId];
  },

  onSpeaking(callback) {
    onSpeaking = callback;
  },

  onVoiceActivity(callback) {
    onVoiceActivity = callback;
    VoiceEngine.setEmitVADLevel(callback != null);
  },

  onDevicesChanged(callback) {
    if (callback != null) {
      onDevicesChanged = (inputDevices, outputDevices) => {
        callback(sanitizeDevices(inputDevices), sanitizeDevices(outputDevices));
      };

      VoiceEngine.getInputDevices(NativeUtils.makeDeferred(inputDevices => {
        VoiceEngine.getOutputDevices(NativeUtils.makeDeferred(outputDevices => {
          onDevicesChanged(inputDevices, outputDevices);
        }));
      }));
    }
    else {
      onDevicesChanged = null;
    }
  },

  getInputDevices(callback) {
    VoiceEngine.getInputDevices(NativeUtils.makeDeferred(devices => callback(sanitizeDevices(devices))));
  },

  getOutputDevices(callback) {
    VoiceEngine.getOutputDevices(NativeUtils.makeDeferred(devices => callback(sanitizeDevices(devices))));
  },

  setEncodingBitRate(bitrate) {
    if (VoiceEngine.setEncodingBitRate) {
      VoiceEngine.setEncodingBitRate(bitrate);
    }
  },

  supportsEncodingBitRate() {
    return VoiceEngine.setEncodingBitRate != null;
  },

  setEchoCancellation(enabled) {
    echoCancellation = enabled ? EchoCancellation.CONFERANCE : EchoCancellation.DISABLED;
    if (hasTransport) {
      VoiceEngine.setTransportOptions({echoCancellation});
    }
  },

  setNoiseSuppression(enabled) {
    noiseSuppression = enabled ? NoiseSuppression.HIGH_SUPPRESSION : NoiseSuppression.DISABLED;
    if (hasTransport) {
      VoiceEngine.setTransportOptions({noiseSuppression});
    }
  },

  setAutomaticGainControl(enabled) {
    automaticGainControl = enabled ? AutomaticGainControl.ADAPTIVE_ANALOG : AutomaticGainControl.DISABLED;
    if (hasTransport) {
      VoiceEngine.setTransportOptions({automaticGainControl});
    }
  },

  setAttenuation(attenuation) {
    attenuationFactor = (100 - attenuation) / 100;
    if (hasTransport) {
      VoiceEngine.setTransportOptions({
        attenuation: isAttenuating(),
        attenuationFactor: attenuationFactor
      });
    }
  },

  isAttenuationEnabled() {
    return isAttenuating();
  },

  canSetAttenuation() {
    return NativeUtils.isWindows();
  },

  canSetVoiceProcessing() {
    return true;
  },

  canSetInputDevice() {
    return true;
  },

  canSetOutputDevice() {
    return true;
  },

  setInputDevice(id) {
    this.getInputDevices(inputDevices => {
      let inputDevice = inputDevices.filter(device => device.id === id)[0] || inputDevices[0];
      inputDeviceIndex = inputDevice.index;
      VoiceEngine.setInputDevice(inputDeviceIndex);
    });
  },

  setOutputDevice(id) {
    this.getOutputDevices(outputDevices => {
      let outputDevice = outputDevices.filter(device => device.id === id)[0] || outputDevices[0];
      outputDeviceIndex = outputDevice.index;
      VoiceEngine.setOutputDevice(outputDeviceIndex);
    });
  },

  connect(ssrc, userId, address, port, callback) {
    return createTransport(ssrc, userId, address, port, callback);
  },

  disconnect() {
    destroyTransport();
  },

  handleSpeaking: noop,

  handleSessionDescription(desc) {
    encryptionSettings = {
      mode: desc['mode'],
      secretKey: desc['secret_key']
    };
    VoiceEngine.setTransportOptions({encryptionSettings});
  },

  playSound(name, volume = 1) {
    if (VERSION_REQ_FULL_PATH_SOUNDS) {
      const {resourcesPath} = NativeUtils.require('process', true);
      VoiceEngine.playSound(path.join(path.join(resourcesPath, 'sounds'), `${name}.wav`), volume);
    }
    else {
      VoiceEngine.playSound(name, volume);
    }
  },

  supportsAutomaticVAD() {
    return VERSION_REQ_AUTOMATIC_VAD;
  },

  supportsMultiplePTT() {
    return VoiceEngine.setPTTActive != null;
  },

  supportsPTTReleaseDelay() {
    return VERSION_REQ_PTT_RELEASE_DELAY;
  },

  setForceSend(send) {
    VoiceEngine.setPTTActive && VoiceEngine.setPTTActive(send);
  },

  onConnectionState(callback) {
    onConnectionState = callback;
  },

  getTransportOptions,
  getUserOptions,

  debugDump(callback) {
    let data = {
      implementation: 'native',
      hasTransport,
      selfMute,
      inputVolume,
      outputVolume,
      inputDeviceIndex,
      outputDeviceIndex,
      inputMode,
      vadThreshold
    };
    VoiceEngine.debugDump(NativeUtils.makeDeferred(({Native}) => {
      data.native = Native;
      callback(data);
    }));
  },

  collectDiagnostics(callback) {
    if (VoiceEngine.collectDiagnostics) {
      VoiceEngine.collectDiagnostics(NativeUtils.makeDeferred(callback));
    }
    else {
      callback(null);
    }
  },

  diagnosticsEnabled: VoiceEngine.collectDiagnostics != null,

  setNoInputThreshold: inputDetectionVersionGuard(VoiceEngine.setNoInputThreshold),

  setNoInputCallback: inputDetectionVersionGuard(VoiceEngine.setNoInputCallback),

  // Not a fan of how this is imported, but doing it quick.
  runDiagnostics: require('./Diagnostics').runDiagnostics,
  getDiagnosticInfo: require('./Diagnostics').getDiagnosticInfo,
  Constants: require('./Constants'),
  supportsNativePing: VoiceEngine.setPingCallback != null,
  setPingCallback: VoiceEngine.setPingCallback ? (callback) => {
    if (callback == null) {
      // Set to noop, as native code doesn't support passing "null".
      VoiceEngine.setPingCallback(noop);
    }
    else {
      VoiceEngine.setPingCallback(NativeUtils.makeDeferred(callback));
    }
  } : noop
};



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/native/index.js
 **/