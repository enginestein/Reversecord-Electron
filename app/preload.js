'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _electron = require('electron');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log('I run before anything else');

var mainProcess = _electron.remote.require('./VoiceEngine');
var runWebpackCb = false;

function noop() {};

function webpackCb(chunkIds, moreModules) {
  if (runWebpackCb) return;
  runWebpackCb = true;

  console.log('parent webpack');

  setImmediate(afterInitialJsonp);
}

function findWebpackModule(exportedToLookFor) {
  var webpackRequire = window.__webpackRequire;
  var mod = webpackRequire.c;
  var results = [];

  for (var i = 0; i < webpackRequire.m.length; i++) {
    if (mod[i] && mod[i].exports && exportedToLookFor.every(function (x) {
      return mod[i].exports[x];
    })) {
      results.push(mod[i]);
    }
  }

  return results;
}

var loadedVoiceEngine = null;
function findWebRTCModule() {
  if (loadedVoiceEngine) {
    return loadedVoiceEngine;
  }

  var voiceLoader = findWebpackModule(['handleSessionDescription']).filter(function (x) {
    return __webpackRequire.m[x.id].toString().match(/webkitGetUserMedia/);
  })[0];
  if (!voiceLoader) {
    throw new Error('Cannot find voice engine loader');
  }
  var text = __webpackRequire.m[voiceLoader.id].toString();
  var reg = /n\(([0-9]+)\)/g;
  var results = [];
  var res = null;

  while (res = reg.exec(text)) {
    results.push(res);
  }

  loadedVoiceEngine = results.filter(function (x) {
    return !__webpackRequire.c[x[1]];
  }).map(function (x) {
    return parseInt(x[1]);
  })[0];

  return loadedVoiceEngine;
}

var lastVoiceEngine = null;
var lastInputMode = null;
function shimVoiceEngine(voiceEngine) {
  if (voiceEngine === lastVoiceEngine) {
    return;
  }

  lastVoiceEngine = voiceEngine;
  console.log('shimming', voiceEngine);

  var num = findWebRTCModule();
  var obj = __webpackRequire(num);

  var playSound = findWebpackModule(['playSound']).filter(function (x) {
    return Object.keys(x.exports).length === 1;
  })[0].exports.playSound;


  Object.assign(voiceEngine, obj);
  voiceEngine.playSound = function playSound2(name, volume) {
    playSound(name, volume, true);
  };

  obj.onSpeaking(function () {
    var _console;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    (_console = console).log.apply(_console, ['onSpeaking'].concat(args));
    mainProcess.handleOnSpeakingEvent.apply(mainProcess, args);
  });
  obj.onVoiceActivity(function () {
    mainProcess.handleOnVoiceEvent.apply(mainProcess, arguments);
  });
  //obj.onDevicesChanged((...args) => {
  //  mainProcess.handleOnDevicesChangedEvent(...args);
  //});
  if (lastInputMode) {
    var _lastInputMode = lastInputMode;
    var mode = _lastInputMode.mode;
    var options = _lastInputMode.options;

    obj.setInputMode(mode, options);
  }

  obj.getInputDevices(function (devices) {
    var device = devices[0].id;
    obj.setInputDevice(device);

    obj.enable(function (err) {
      console.log('VoiceEngine.enable', err);
    });
  });
}

function injectedModule(module, exports, webpackRequire) {
  console.log('injected module');

  var modules = webpackRequire.c;
  var webpackVoiceEngines = [];

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

_electron.ipcRenderer.on('handleSetInputMode', function handleSetInputMode(ev, mode, options) {
  lastInputMode = { mode: mode, options: options };
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
window['getVoiceEngine'] = function () {
  return lastVoiceEngine;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYi5Wb2ljZUVuZ2luZS5zaGltLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxRQUFRLEdBQVIsQ0FBWSw0QkFBWjs7QUFLQSxJQUFNLGNBQWMsaUJBQU8sT0FBUCxDQUFlLGVBQWYsQ0FBZDtBQUNOLElBQUksZUFBZSxLQUFmOztBQUVKLFNBQVMsSUFBVCxHQUFnQixFQUFoQjs7QUFFQSxTQUFTLFNBQVQsQ0FBbUIsUUFBbkIsRUFBNkIsV0FBN0IsRUFBMEM7QUFDeEMsTUFBSSxZQUFKLEVBQWtCLE9BQWxCO0FBQ0EsaUJBQWUsSUFBZixDQUZ3Qzs7QUFJeEMsVUFBUSxHQUFSLENBQVksZ0JBQVosRUFKd0M7O0FBTXhDLGVBQWEsaUJBQWIsRUFOd0M7Q0FBMUM7O0FBU0EsU0FBUyxpQkFBVCxDQUEyQixpQkFBM0IsRUFBOEM7QUFDNUMsTUFBTSxpQkFBaUIsT0FBTyxnQkFBUCxDQURxQjtBQUU1QyxNQUFNLE1BQU0sZUFBZSxDQUFmLENBRmdDO0FBRzVDLE1BQUksVUFBVSxFQUFWLENBSHdDOztBQUs1QyxPQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sSUFBSSxlQUFlLENBQWYsQ0FBaUIsTUFBakIsRUFBeUIsR0FBN0MsRUFBa0Q7QUFDaEQsUUFBSSxJQUFJLENBQUosS0FBVSxJQUFJLENBQUosRUFBTyxPQUFQLElBQWtCLGtCQUFrQixLQUFsQixDQUF3QjthQUFLLElBQUksQ0FBSixFQUFPLE9BQVAsQ0FBZSxDQUFmO0tBQUwsQ0FBcEQsRUFBNkU7QUFDL0UsY0FBUSxJQUFSLENBQWEsSUFBSSxDQUFKLENBQWIsRUFEK0U7S0FBakY7R0FERjs7QUFNQSxTQUFPLE9BQVAsQ0FYNEM7Q0FBOUM7O0FBY0EsSUFBSSxvQkFBb0IsSUFBcEI7QUFDSixTQUFTLGdCQUFULEdBQTRCO0FBQzFCLE1BQUksaUJBQUosRUFBdUI7QUFDckIsV0FBTyxpQkFBUCxDQURxQjtHQUF2Qjs7QUFJQSxNQUFNLGNBQWMsa0JBQWtCLENBQUMsMEJB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LGtCQUFnQixFQUFDLFVBQUQsRUFBTyxnQkFBUCxFQUFoQixDQURrRjtBQUVsRixNQUFJLGVBQUosRUFBcUI7QUFDbkIsWUFBUSxHQUFSLENBQVksb0JBQVosRUFEbUI7QUFFbkIsb0JBQWdCLFlBQWhCLENBQTZCLElBQTdCLEVBQW1DLE9BQW5DLEVBRm1CO0dBQXJCLE1BR087QUFDTCxZQUFRLEdBQVIsQ0FBWSw2REFBWixFQURLO0dBSFA7Q0FGbUMsQ0FBckM7OztBQVdBLE9BQU8sY0FBUCxJQUF5QixTQUF6QjtBQUNBLE9BQU8sbUJBQVAsSUFBOEIsaUJBQTlCO0FBQ0EsT0FBTyxrQkFBUCxJQUE2QixnQkFBN0I7QUFDQSxPQUFPLGdCQUFQLElBQTJCO1NBQU07Q0FBTiIsImZpbGUiOiJ3ZWIuVm9pY2VFbmdpbmUuc2hpbS5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnNvbGUubG9nKCdJIHJ1biBiZWZvcmUgYW55dGhpbmcgZWxzZScpO1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGlwY1JlbmRlcmVyLCByZW1vdGUgfSBmcm9tICdlbGVjdHJvbic7XG5cbmNvbnN0IG1haW5Qcm9jZXNzID0gcmVtb3RlLnJlcXVpcmUoJy4vVm9pY2VFbmdpbmUnKTtcbnZhciBydW5XZWJwYWNrQ2IgPSBmYWxzZTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9O1xuXG5mdW5jdGlvbiB3ZWJwYWNrQ2IoY2h1bmtJZHMsIG1vcmVNb2R1bGVzKSB7XG4gIGlmIChydW5XZWJwYWNrQ2IpIHJldHVybjtcbiAgcnVuV2VicGFja0NiID0gdHJ1ZTtcblxuICBjb25zb2xlLmxvZygncGFyZW50IHdlYnBhY2snKTtcblxuICBzZXRJbW1lZGlhdGUoYWZ0ZXJJbml0aWFsSnNvbnApO1xufVxuXG5mdW5jdGlvbiBmaW5kV2VicGFja01vZHVsZShleHBvcnRlZFRvTG9va0Zvcikge1xuICBjb25zdCB3ZWJwYWNrUmVxdWlyZSA9IHdpbmRvdy5fX3dlYnBhY2tSZXF1aXJlO1xuICBjb25zdCBtb2QgPSB3ZWJwYWNrUmVxdWlyZS5jO1xuICBsZXQgcmVzdWx0cyA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgd2VicGFja1JlcXVpcmUubS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChtb2RbaV0gJiYgbW9kW2ldLmV4cG9ydHMgJiYgZXhwb3J0ZWRUb0xvb2tGb3IuZXZlcnkoeCA9PiBtb2RbaV0uZXhwb3J0c1t4XSkpIHtcbiAgICAgIHJlc3VsdHMucHVzaChtb2RbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5sZXQgbG9hZGVkVm9pY2VFbmdpbmUgPSBudWxsO1xuZnVuY3Rpb24gZmluZFdlYlJUQ01vZHVsZSgpIHtcbiAgaWYgKGxvYWRlZFZvaWNlRW5naW5lKSB7XG4gICAgcmV0dXJuIGxvYWRlZFZvaWNlRW5naW5lO1xuICB9XG5cbiAgY29uc3Qgdm9pY2VMb2FkZXIgPSBmaW5kV2VicGFja01vZHVsZShbJ2hhbmRsZVNlc3Npb25EZXNjcmlwdGlvbiddKVxuICAgIC5maWx0ZXIoeCA9PiBfX3dlYnBhY2tSZXF1aXJlLm1beC5pZF0udG9TdHJpbmcoKS5tYXRjaCgvd2Via2l0R2V0VXNlck1lZGlhLykpWzBdO1xuICBpZiAoIXZvaWNlTG9hZGVyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZmluZCB2b2ljZSBlbmdpbmUgbG9hZGVyJyk7XG4gIH1cbiAgY29uc3QgdGV4dCA9IF9fd2VicGFja1JlcXVpcmUubVt2b2ljZUxvYWRlci5pZF0udG9TdHJpbmcoKTtcbiAgY29uc3QgcmVnID0gL25cXCgoWzAtOV0rKVxcKS9nO1xuICBsZXQgcmVzdWx0cyA9IFtdO1xuICB2YXIgcmVzID0gbnVsbDtcblxuICB3aGlsZSAoKHJlcyA9IHJlZy5leGVjKHRleHQpKSkge1xuICAgIHJlc3VsdHMucHVzaChyZXMpO1xuICB9XG5cbiAgbG9hZGVkVm9pY2VFbmdpbmUgPSAgcmVzdWx0c1xuICAgIC5maWx0ZXIoeCA9PiAhX193ZWJwYWNrUmVxdWlyZS5jW3hbMV1dKVxuICAgIC5tYXAoeCA9PiBwYXJzZUludCh4WzFdKSlbMF07XG5cbiAgcmV0dXJuIGxvYWRlZFZvaWNlRW5naW5lO1xufVxuXG5sZXQgbGFzdFZvaWNlRW5naW5lID0gbnVsbDtcbmxldCBsYXN0SW5wdXRNb2RlID0gbnVsbDtcbmZ1bmN0aW9uIHNoaW1Wb2ljZUVuZ2luZSh2b2ljZUVuZ2luZSkge1xuICBpZiAodm9pY2VFbmdpbmUgPT09IGxhc3RWb2ljZUVuZ2luZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxhc3RWb2ljZUVuZ2luZSA9IHZvaWNlRW5naW5lO1xuICBjb25zb2xlLmxvZygnc2hpbW1pbmcnLCB2b2ljZUVuZ2luZSk7XG5cbiAgY29uc3QgbnVtID0gZmluZFdlYlJUQ01vZHVsZSgpO1xuICBjb25zdCBvYmogPSBfX3dlYnBhY2tSZXF1aXJlKG51bSk7XG5cbiAgY29uc3Qge3BsYXlTb3VuZH0gPSBmaW5kV2VicGFja01vZHVsZShbJ3BsYXlTb3VuZCddKS5maWx0ZXIoeCA9PiBPYmplY3Qua2V5cyh4LmV4cG9ydHMpLmxlbmd0aCA9PT0gMSlbMF0uZXhwb3J0cztcblxuICBPYmplY3QuYXNzaWduKHZvaWNlRW5naW5lLCBvYmopO1xuICB2b2ljZUVuZ2luZS5wbGF5U291bmQgPSBmdW5jdGlvbiBwbGF5U291bmQyKG5hbWUsIHZvbHVtZSkge1xuICAgIHBsYXlTb3VuZChuYW1lLCB2b2x1bWUsIHRydWUpO1xuICB9O1xuXG4gIG9iai5vblNwZWFraW5nKCguLi5hcmdzKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ29uU3BlYWtpbmcnLCAuLi5hcmdzKTtcbiAgICBtYWluUHJvY2Vzcy5oYW5kbGVPblNwZWFraW5nRXZlbnQoLi4uYXJncyk7XG4gIH0pO1xuICBvYmoub25Wb2ljZUFjdGl2aXR5KCguLi5hcmdzKSA9PiB7XG4gICAgbWFpblByb2Nlc3MuaGFuZGxlT25Wb2ljZUV2ZW50KC4uLmFyZ3MpO1xuICB9KTtcbiAgLy9vYmoub25EZXZpY2VzQ2hhbmdlZCgoLi4uYXJncykgPT4ge1xuICAvLyAgbWFpblByb2Nlc3MuaGFuZGxlT25EZXZpY2VzQ2hhbmdlZEV2ZW50KC4uLmFyZ3MpO1xuICAvL30pO1xuICBpZiAobGFzdElucHV0TW9kZSkge1xuICAgIGNvbnN0IHsgbW9kZSwgb3B0aW9ucyB9ID0gbGFzdElucHV0TW9kZTtcbiAgICBvYmouc2V0SW5wdXRNb2RlKG1vZGUsIG9wdGlvbnMpO1xuICB9XG5cbiAgb2JqLmdldElucHV0RGV2aWNlcygoZGV2aWNlcykgPT4ge1xuICAgIGNvbnN0IGRldmljZSA9IGRldmljZXNbMF0uaWQ7XG4gICAgb2JqLnNldElucHV0RGV2aWNlKGRldmljZSk7XG5cbiAgICBvYmouZW5hYmxlKChlcnIpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdWb2ljZUVuZ2luZS5lbmFibGUnLCBlcnIpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5qZWN0ZWRNb2R1bGUobW9kdWxlLCBleHBvcnRzLCB3ZWJwYWNrUmVxdWlyZSkge1xuICBjb25zb2xlLmxvZygnaW5qZWN0ZWQgbW9kdWxlJyk7XG5cbiAgY29uc3QgbW9kdWxlcyA9IHdlYnBhY2tSZXF1aXJlLmM7XG4gIGxldCB3ZWJwYWNrVm9pY2VFbmdpbmVzID0gW107XG5cbiAgd2luZG93Ll9fd2VicGFja1JlcXVpcmUgPSB3ZWJwYWNrUmVxdWlyZTtcbiAgd2luZG93Ll9fdm9pY2VFbmdpbmVzID0gd2VicGFja1ZvaWNlRW5naW5lcztcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHdlYnBhY2tSZXF1aXJlLm0ubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAobW9kdWxlc1tpXSAmJiBtb2R1bGVzW2ldLmV4cG9ydHMgJiYgbW9kdWxlc1tpXS5leHBvcnRzLmhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbikge1xuICAgICAgd2VicGFja1ZvaWNlRW5naW5lcy5wdXNoKG1vZHVsZXNbaV0pO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKHdlYnBhY2tWb2ljZUVuZ2luZXMubGVuZ3RoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3ZWJwYWNrVm9pY2VFbmdpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzaGltVm9pY2VFbmdpbmUod2VicGFja1ZvaWNlRW5naW5lc1tpXS5leHBvcnRzKTtcbiAgICB9XG4gIH1cblxuICBtb2R1bGUuZXhwb3J0cyA9IHsgbWJpbGtlcjogdHJ1ZSB9O1xufVxuXG5mdW5jdGlvbiBhZnRlckluaXRpYWxKc29ucCgpIHtcbiAgY29uc29sZS5sb2cod2luZG93Wyd3ZWJwYWNrSnNvbnAnXSk7XG5cbiAgd2luZG93Wyd3ZWJwYWNrSnNvbnAnXShbMF0sIFtpbmplY3RlZE1vZHVsZV0pO1xufVxuXG5pcGNSZW5kZXJlci5vbignaGFuZGxlU2V0SW5wdXRNb2RlJywgZnVuY3Rpb24gaGFuZGxlU2V0SW5wdXRNb2RlKGV2LCBtb2RlLCBvcHRpb25zKSB7XG4gIGxhc3RJbnB1dE1vZGUgPSB7bW9kZSwgb3B0aW9uc307XG4gIGlmIChsYXN0Vm9pY2VFbmdpbmUpIHtcbiAgICBjb25zb2xlLmxvZygnc2V0dGluZyBpbnB1dCBtb2RlJyk7XG4gICAgbGFzdFZvaWNlRW5naW5lLnNldElucHV0TW9kZShtb2RlLCBvcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmxvZygnbm8gdm9pY2UgZW5naW5lIGF2YWlsYWJsZSwgc3RvcmluZyBmb3IgbGF0ZXIgaW5pdGlhbGl6YXRpb24nKTtcbiAgfVxufSk7XG5cbi8vd2luZG93Wyd3ZWJwYWNrSnNvbnAnXSA9IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSwgJ3BhcmVudCB3ZWJwYWNrOicpO1xud2luZG93Wyd3ZWJwYWNrSnNvbnAnXSA9IHdlYnBhY2tDYjtcbndpbmRvd1snZmluZFdlYnBhY2tNb2R1bGUnXSA9IGZpbmRXZWJwYWNrTW9kdWxlO1xud2luZG93WydmaW5kV2ViUlRDTW9kdWxlJ10gPSBmaW5kV2ViUlRDTW9kdWxlO1xud2luZG93WydnZXRWb2ljZUVuZ2luZSddID0gKCkgPT4gbGFzdFZvaWNlRW5naW5lO1xuIl19

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJwcmVsb2FkLmpzIn0=