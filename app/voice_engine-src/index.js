import {ipcRenderer} from 'electron';
import path from 'path';

localStorage.debug = '*';

import monkeyPatch from './superagentPatch';
import VoiceEngine from './lib/voice_engine/webrtc';

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

window.VoiceEngine = VoiceEngine;

let sounds = {};

const _deInterop = (arg) => {
  if (arg && arg['__INTEROP_CALLBACK'] && arg.name) {
    return (...args) => {
      if (!arg.name.startsWith('setOnSpeakingCallback') &&
          !arg.name.startsWith('setOnVoiceCallback') &&
          !arg.name.startsWith('setDeviceChangeCallback')) {
        console.log(`${arg.name}:`, ...args);
      }
      ipcRenderer.send(arg.name, ...args);
    };
  } else {
    return arg;
  }
};

ipcRenderer.on('get-token-and-fingerprint', function(ev, {token: rawToken, fingerprint}) {
  const token = (rawToken || '').replace(/"/g, '');

  console.log(`get-token-and-fingerprint: token=${token} fingerprint=${fingerprint}`);
  window.token = token;
  window.fingerprint = fingerprint;

  localStorage.setItem('token', token);
  localStorage.setItem('fingerprint', fingerprint);

  VoiceEngine.getInputDevices((devices) => {
    const device = devices[0].id;
    VoiceEngine.setInputDevice(device);

    VoiceEngine.enable((err) => {
      console.log('VoiceEngine.enable:', err);
    });
  });
});

ipcRenderer.on('callVoiceEngineMethod', (ev, args) => {
  let methodName = args.shift();
  let passedArgs = [];

  if (methodName !== 'createUser' && methodName !== 'handleSpeaking') {
    console.log(`${methodName}:`, ...args);
  }

  args.forEach((arg) => {
    if (arg && arg.__INTEROP_CALLBACK) {
      passedArgs.push(_deInterop(arg));
    } else {
      passedArgs.push(arg);
    }
  });

  VoiceEngine[methodName].apply(null, passedArgs);
});

ipcRenderer.on('setOnSpeakingCallback', function(ev, cb) {
  console.log('setOnSpeakingCallback:', cb);
  VoiceEngine.onSpeaking(_deInterop(cb));
});
ipcRenderer.on('setOnVoiceCallback', function(ev, cb) {
  console.log('setOnVoiceCallback:', cb);
  VoiceEngine.onVoiceActivity(_deInterop(cb));
});
ipcRenderer.on('setDeviceChangeCallback', function(ev, cb) {
  console.log('setDeviceChangeCallback:', cb);
  VoiceEngine.onDevicesChanged(_deInterop(cb));
});

ipcRenderer.on('playSound', function(ev, name, volume) {
  console.log('playSound:', name, volume);

  let sound = sounds[name];
  if (sound == null) {
    sound = document.createElement('audio');
    sound.src = 'file://' + path.resolve(__dirname, '..', 'sounds', name + '.wav');
    sound.preload = true;
    sounds[name] = sound;
  }
  sound.volume = volume;
  sound.load();
  sound.play();
});
