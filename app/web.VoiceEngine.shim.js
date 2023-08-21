console.log('I run before anything else');

import path from 'path';
import { ipcRenderer, remote } from 'electron';

const mainProcess = remote.require('./VoiceEngine');
var runWebpackCb = false;

function noop() {};

function webpackCb(chunkIds, moreModules) {
  if (runWebpackCb) return;
  runWebpackCb = true;

  console.log('parent webpack');

  setImmediate(afterInitialJsonp);
}

function findWebpackModule(exportedToLookFor) {
  const webpackRequire = window.__webpackRequire;
  const mod = webpackRequire.c;
  let results = [];

  for (var i = 0; i < webpackRequire.m.length; i++) {
    if (mod[i] && mod[i].exports && exportedToLookFor.every(x => mod[i].exports[x])) {
      results.push(mod[i]);
    }
  }

  return results;
}

let loadedVoiceEngine = null;
function findWebRTCModule() {
  if (loadedVoiceEngine) {
    return loadedVoiceEngine;
  }

  const voiceLoader = findWebpackModule(['handleSessionDescription'])
    .filter(x => __webpackRequire.m[x.id].toString().match(/webkitGetUserMedia/))[0];
  if (!voiceLoader) {
    throw new Error('Cannot find voice engine loader');
  }
  const text = __webpackRequire.m[voiceLoader.id].toString();
  const reg = /n\(([0-9]+)\)/g;
  let results = [];
  var res = null;

  while ((res = reg.exec(text))) {
    results.push(res);
  }

  loadedVoiceEngine =  results
    .filter(x => !__webpackRequire.c[x[1]])
    .map(x => parseInt(x[1]))[0];

  return loadedVoiceEngine;
}

let lastVoiceEngine = null;
let lastInputMode = null;
function shimVoiceEngine(voiceEngine) {
  if (voiceEngine === lastVoiceEngine) {
    return;
  }

  lastVoiceEngine = voiceEngine;
  console.log('shimming', voiceEngine);

  const num = findWebRTCModule();
  const obj = __webpackRequire(num);

  const {playSound} = findWebpackModule(['playSound']).filter(x => Object.keys(x.exports).length === 1)[0].exports;

  Object.assign(voiceEngine, obj);
  voiceEngine.playSound = function playSound2(name, volume) {
    playSound(name, volume, true);
  };

  obj.onSpeaking((...args) => {
    console.log('onSpeaking', ...args);
    mainProcess.handleOnSpeakingEvent(...args);
  });
  obj.onVoiceActivity((...args) => {
    mainProcess.handleOnVoiceEvent(...args);
  });
  //obj.onDevicesChanged((...args) => {
  //  mainProcess.handleOnDevicesChangedEvent(...args);
  //});
  if (lastInputMode) {
    const { mode, options } = lastInputMode;
    obj.setInputMode(mode, options);
  }

  obj.getInputDevices((devices) => {
    const device = devices[0].id;
    obj.setInputDevice(device);

    obj.enable((err) => {
      console.log('VoiceEngine.enable', err);
    });
  });
}

function injectedModule(module, exports, webpackRequire) {
  console.log('injected module');

  const modules = webpackRequire.c;
  let webpackVoiceEngines = [];

  window.__webpackRequire = webpackRequire;
  window.__voiceEngines = webpackVoiceEngines;

  for (var i = 0; i < webpackRequire.m.length; i++) {
    if (modules[i] && modules[i].exports && modules[i].exports.handleSessionDescription) {
      webpackVoiceEngines.push(modules[i]);
      break;
    }
  }

  if (webpackVoiceEngines.length) {
    for (var i = 0; i < webpackVoiceEngines.length; i++) {
      shimVoiceEngine(webpackVoiceEngines[i].exports);
    }
  }

  module.exports = { mbilker: true };
}

function afterInitialJsonp() {
  console.log(window['webpackJsonp']);

  window['webpackJsonp']([0], [injectedModule]);
}

ipcRenderer.on('handleSetInputMode', function handleSetInputMode(ev, mode, options) {
  lastInputMode = {mode, options};
  if (lastVoiceEngine) {
    console.log('setting input mode');
    lastVoiceEngine.setInputMode(mode, options);
  } else {
    console.log('no voice engine available, storing for later initialization');
  }
});

//window['webpackJsonp'] = console.log.bind(console, 'parent webpack:');
window['webpackJsonp'] = webpackCb;
window['findWebpackModule'] = findWebpackModule;
window['findWebRTCModule'] = findWebRTCModule;
window['getVoiceEngine'] = () => lastVoiceEngine;
