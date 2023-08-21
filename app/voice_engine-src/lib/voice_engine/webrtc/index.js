import AudioInput from './AudioInput';
import AudioOutput from './AudioOutput';
import PeerConnection from './PeerConnection';
import {VoiceConnectionStates} from '../../../Constants';
import platform from 'platform';

const DEFAULT_VOLUME = 100;

let peerConnection;
let connectionState = VoiceConnectionStates.VOICE_DISCONNECTED;
let audioOutputs = {};
let remoteSSRCs = {};
let selfDeaf = false;
let outputVolume = DEFAULT_VOLUME;
let localMutes = {};
let localVolumes = {};
let speakers = {};
let onSpeaking = function() {};
let onConnectionState = null;
let bitrate = null;

const audioInput = new AudioInput();
audioInput.onSpeaking = speaking => onSpeaking(null, speaking);

function getLocalVolume(userId) {
  const volume = localVolumes[userId];
  return volume != null ? volume : DEFAULT_VOLUME;
}

function computeLocalVolume(userId) {
  return (outputVolume * getLocalVolume(userId)) / DEFAULT_VOLUME;
}

function setConnectionState(state) {
  connectionState = state;
  onConnectionState && onConnectionState(state);
}

function createAudioOutput(userId, stream) {
  let audioOutput = new AudioOutput(userId, stream);
  audioOutput.mute = selfDeaf || localMutes[userId];
  audioOutput.volume = computeLocalVolume(userId);
  audioOutput.onSpeaking = speaking => onSpeaking(userId, speaking);
  audioOutput.speaking = speakers[userId] || false;
  audioOutputs[userId] = audioOutput;
}

function destroyAudioOutput(userId) {
  const audioOutput = audioOutputs[userId];
  if (audioOutput != null) {
    audioOutput.destroy();
    delete audioOutputs[userId];
  }
}

let onDevicesChanged;
function syncDevices() {
  audioInput.getInputDevices(inputDevices => {
    audioInput.getOutputDevices(outputDevices => {
      onDevicesChanged && onDevicesChanged(inputDevices, outputDevices);
    });
  });
}
setInterval(syncDevices, 5000);

function noop() {}

export default {
  supported: true,

  autoEnable: false,

  enable(callback) {
    audioInput.enable((err, stream) => {
      callback(err);

      if (peerConnection) {
        peerConnection.stream = stream;
      }
    });
  },

  supportsAutomaticVAD() {
    return false;
  },

  supportsMultiplePTT() {
    return true;
  },

  supportsPTTReleaseDelay() {
    return true;
  },

  setForceSend(send) {
    audioInput.setPTTActive(send);
  },

  setInputMode(mode, options) {
    audioInput.setMode(mode, options);
  },

  setInputVolume: noop,

  setOutputVolume(volume) {
    outputVolume = volume;
    for (let userId of Object.keys(audioOutputs)) {
      audioOutputs[userId].volume = computeLocalVolume(userId);
    }
  },

  setVolumeChangeCallback: noop,

  setSelfMute(mute) {
    audioInput.mute = mute;
  },

  setSelfDeaf(deaf) {
    selfDeaf = deaf;
    for (let userId of Object.keys(audioOutputs)) {
      audioOutputs[userId].mute = deaf || localMutes[userId];
    }
  },

  setLocalMute(userId, mute) {
    localMutes[userId] = mute;
    if (audioOutputs[userId] != null) {
      audioOutputs[userId].mute = selfDeaf || mute;
    }
  },

  setLocalVolume(userId, volume) {
    localVolumes[userId] = volume;
    if (audioOutputs[userId] != null) {
      audioOutputs[userId].volume = computeLocalVolume(userId);
    }
  },

  createUser(userId, ssrc) {
    remoteSSRCs[userId] = ssrc;
    peerConnection && peerConnection.setRemoteStream(userId, ssrc);
  },

  destroyUser(userId) {
    delete remoteSSRCs[userId];
    peerConnection && peerConnection.removeRemoteStream(userId);
  },

  onSpeaking(callback) {
    onSpeaking = callback;
  },

  onVoiceActivity(callback) {
    audioInput.onVoiceActivity = callback;
  },

  onDevicesChanged(callback) {
    onDevicesChanged = callback;
    process.nextTick(syncDevices);
  },

  getInputDevices(callback) {
    audioInput.getInputDevices(callback);
  },

  getOutputDevices(callback) {
    audioInput.getOutputDevices(callback);
  },

  canSetInputDevice() {
    return MediaStreamTrack.getSources != null;
  },

  setInputDevice(id) {
    audioInput.setSource(id, (err, stream) => {
      if (err == null && peerConnection != null) {
        peerConnection.stream = stream;
      }
    });
  },

  canSetOutputDevice() {
    return false;
  },

  setOutputDevice: noop,

  setEncodingBitRate(newBitRate) {
    bitrate = newBitRate;
    peerConnection && peerConnection.setBitRate(bitrate);
  },

  supportsEncodingBitRate() {
    return true;
  },

  setEchoCancellation(enabled) {
    audioInput.echoCancellation = enabled;
  },

  setNoiseSuppression(enabled) {
    audioInput.noiseSuppression = enabled;
  },

  setAutomaticGainControl(enabled) {
    audioInput.automaticGainControl = enabled;
  },

  canSetAttenuation() {
    return false;
  },

  canSetVoiceProcessing() {
    return platform.layout === 'Blink';
  },

  setAttenuation: noop,

  onConnectionState(callback) {
    onConnectionState = callback;
  },

  connect(ssrc, userId, address, port, callback) {
    peerConnection = new PeerConnection(ssrc, address, port, bitrate);
    peerConnection.on('addstream', (cname, stream) => createAudioOutput(cname, stream));
    peerConnection.on('removestream', cname => destroyAudioOutput(cname));
    peerConnection.once('connected', () => {
      audioInput.reset();
      setConnectionState(VoiceConnectionStates.VOICE_CONNECTED);
    });
    peerConnection.on('checking', () => setConnectionState(VoiceConnectionStates.ICE_CHECKING));
    peerConnection.on('failed', () => setConnectionState(VoiceConnectionStates.NO_ROUTE));
    peerConnection.on('disconnected', () => setConnectionState(VoiceConnectionStates.VOICE_DISCONNECTED));
    peerConnection.on('closed', () => setConnectionState(VoiceConnectionStates.VOICE_DISCONNECTED));
    peerConnection.once('offer', sdp => callback(null, 'webrtc', sdp));
    peerConnection.stream = audioInput.stream;
    peerConnection.connect();

    setConnectionState(VoiceConnectionStates.VOICE_CONNECTING);
  },

  disconnect() {
    remoteSSRCs = {};

    for (let key of Object.keys(audioOutputs)) {
      destroyAudioOutput(key);
    }

    if (peerConnection != null) {
      peerConnection.close();
      peerConnection = null;
    }

    setConnectionState(VoiceConnectionStates.VOICE_DISCONNECTED);
  },

  handleSessionDescription({sdp}) {
    peerConnection.remoteSDP = sdp;
  },

  handleSpeaking(userId, speaking) {
    if (speaking) {
      speakers[userId] = speaking;
    }
    else {
      delete speakers[userId];
    }
    if (audioOutputs[userId] != null) {
      audioOutputs[userId].speaking = speaking;
    }
  },

  debugDump(callback) {
    let stream = null;
    if (audioInput.stream != null) {
      stream = {
        id: audioInput.stream.id,
        label: audioInput.stream.label,
        ended: audioInput.stream.ended
      };
    }

    let outputs = {};
    for (let userId of Object.keys(audioOutputs)) {
      let audioOutput = audioOutputs[userId];
      outputs[audioOutput.id] = {
        mute: audioOutput.mute,
        volume: audioOutput.volume,
        speaking: audioOutput.speaking
      };
    }

    let data = {
      implementation: 'webrtc',
      selfDeaf,
      outputVolume,
      input: {
        mute: audioInput.mute,
        speaking: audioInput.speaking,
        sourceId: audioInput['_sourceId'],
        souces: audioInput.sources,
        mode: audioInput.mode,
        modeOptions: audioInput.modeOptions,
        modeReady: audioInput.cleanup != null,
        stream
      },
      outputs
    };

    if (peerConnection != null) {
      data.peerConnection = {
        negotiationNeeded: peerConnection.negotiationNeeded,
        iceConnectionState: peerConnection.iceConnectionState,
        iceGatheringState: peerConnection.iceGatheringState,
        signalingState: peerConnection.signalingState
      };

      if (peerConnection.pc != null) {
        data.peerConnection.localDescription = peerConnection.pc.localDescription;
        data.peerConnection.remoteDescription = peerConnection.pc.remoteDescription;
        peerConnection.pc.getStats(res => {
          data.peerConnection.stats = res.result().map(result => {
            let item = {};
            result.names().forEach(name => item[name] = result.stat(name));
            item.id = result.id;
            item.type = result.type;
            item.timestamp = result.timestamp;
            return item;
          });
          callback(data);
        });
      }
      else {
        callback(data);
      }
    }
    else {
      callback(data);
    }
  },

  setNoInputCallback() {},

  setNoInputThreshold() {},

  collectDiagnostics(callback) {
    callback(null);
  },

  diagnosticsEnabled: false,

  runDiagnostics(callback) {
    callback(null);
  },

  getDiagnosticInfo() {
    return null;
  },

  Constants: {},
  setPingCallback: noop,
  supportsNativePing: false
};



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/index.js
 **/