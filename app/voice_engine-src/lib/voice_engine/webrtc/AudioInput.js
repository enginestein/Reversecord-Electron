import Combokeys from 'combokeys';
import bindGlobal from 'combokeys/plugins/global-bind';
import VAD from './VAD';
import {InputModes} from '../../../Constants';
import Logger from '../../Logger';
//import i18n from '../../../i18n';
import platform from 'platform';

export default class AudioInput {
  constructor() {
    this.context = new AudioContext();

    this.logger = Logger.create(`AudioInput`);

    this._mute = false;
    this._echoCancellation = true;
    this._noiseSuppression = true;
    this._automaticGainControl = true;

    this._sourceId = null;

    this.stream = null;

    this.speaking = false;
    this.onSpeaking = function() {};
    this.onPacket = function() {};
    this.onVoiceActivity = null;

    this.mode = InputModes.VOICE_ACTIVITY;
    this.modeOptions = {};

    this.cleanup = null;
  }

  /**
   * Reset anything that might be useful on a new connection.
   */
  reset() {
    this._setSpeaking(false);
  }

  /**
   * Determine if this user is muted.
   *
   * @return {Boolean}
   */
  get mute() {
    return this._mute;
  }

  /**
   * Set if this user is muted.
   *
   * @param {Boolean} mute
   */
  set mute(mute) {
    this._mute = mute;
    this._setSpeaking(false);
  }

  /**
   * Determine if echo cancellation is enabled.
   *
   * @return {Boolean}
   */
  get echoCancellation() {
    return this._echoCancellation;
  }

  /**
   * Set if echo cancellation is enabled.
   *
   * @param {Boolean} enabled
   */
  set echoCancellation(enabled) {
    this._echoCancellation = enabled;
    this.stream && this.enable();
  }

  /**
   * Determine if noise suppression is enabled.
   *
   * @return {Boolean}
   */
  get noiseSuppression() {
    return this._noiseSuppression;
  }

  /**
   * Set if noise suppression is enabled.
   *
   * @param {Boolean} enabled
   */
  set noiseSuppression(enabled) {
    this._noiseSuppression = enabled;
    this.stream && this.enable();
  }

  /**
   * Determine if automatic gain control is enabled.
   *
   * @return {Boolean}
   */
  get automaticGainControl() {
    return this._automaticGainControl;
  }

  /**
   * Set if automatic gain control is enabled.
   *
   * @param {Boolean} enabled
   */
  set automaticGainControl(enabled) {
    this._automaticGainControl = enabled;
    this.stream && this.enable();
  }

  /**
   * Request Audio input from the user.
   *
   * @param {Function} [callback]
   */
  enable(callback) {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
      this.stream = null;
    }

    this.getInputDevices(sources => {
      let constraints = [
        {googEchoCancellation: this.echoCancellation},
        {googEchoCancellation2: this.echoCancellation},
        {googNoiseSuppression: this.noiseSuppression},
        {googNoiseSuppression2: this.noiseSuppression},
        {googAutoGainControl: this.automaticGainControl},
        {googAutoGainControl2: this.automaticGainControl},
        {googHighpassFilter: true},
        {googTypingNoiseDetection: true}
      ];

      if (sources.some(source => source.id === this._sourceId)) {
        constraints.push({sourceId: this._sourceId});
      }

      navigator.getUserMedia({audio: {optional: constraints}},
        stream => {
          this.stream = stream;
          this._updateAudioTracks();

          if (this.mode) {
            this.setMode(this.mode, this.modeOptions);
          }

          callback && callback(null, stream);
        },
        err => {
          // Normalize errors between Firefox and Chrome.
          if (typeof err !== 'string') {
            switch (err.name) {
              case 'PermissionDeniedError':
                err = 'PERMISSION_DENIED';
                break;
              case 'PermissionDismissedError':
                err = 'PERMISSION_DISMISSED';
                break;
              case 'DevicesNotFoundError':
                err = 'NO_DEVICES_FOUND';
                break;
              default:
                err = 'UNKNOWN';
            }
          }
          callback && callback(err);
        }
      );
    });
  }

  /**
   * Set the current input device.
   *
   * @param {Number} sourceId
   * @param {Function} [callback]
   */
  setSource(sourceId, callback=null) {
    this._sourceId = sourceId;
    if (this.stream != null) {
      this.enable(callback);
    }
    else {
      if (callback != null) {
        callback('NO_STREAM');
      }
    }
  }

  /**
   * Get list of input devices.
   *
   * @param {Function} callback
   */
  getInputDevices(callback) {
    if (MediaStreamTrack.getSources != null) {
      MediaStreamTrack.getSources(sources => {
        const inputDevices = sources
          .filter(source => source.kind === 'audio')
          .map((source, i) => {
            return {
              id: source.id,
              index: i,
              name: source.label || `Source ${i}`
            };
          });
        callback(inputDevices);
      });
    }
    else {
      process.nextTick(() => {
        callback([{id: 'default', index: 0, name: 'Default'}]);
      });
    }
  }

  /**
   * Get all the output devices.
   *
   * @param {Function} callback
   */
  getOutputDevices(callback) {
    process.nextTick(() => {
      callback([{id: 'default', index: 0, name: 'Default'}]);
    });
  }

  /**
   * Set input mode for the microphone and cleanup previous mode.
   *
   * @param {String} mode
   * @param {Object} options
   */
  setMode(mode, options={}) {
    if (this.cleanup) {
      this.cleanup();
    }

    this.mode = mode;
    this.modeOptions = options;

    if (this.stream == null) {
      return;
    }

    switch (mode) {
      case InputModes.PUSH_TO_TALK:
        this.cleanup = this._setupPushToTalk(options);
        break;
      case InputModes.VOICE_ACTIVITY:
        this.cleanup = this._setupVoiceActivity(options);
        break;
    }
  }

  /**
   * Enable speaking. Intended to be used when PTT is active.
   *
   */
  setPTTActive(active) {
    if (this.mute) {
      return;
    }

    if (this.speaking === active) {
      return;
    }

    if (this._pttDelayTimeout) {
      window.clearTimeout(this._pttDelayTimeout);
      this._pttDelayTimeout = null;
    }

    if (!active) {
      this._pttDelayTimeout = window.setTimeout(() => {
        this._setSpeaking(false);
        this._pttDelayTimeout = null;
      }, this.modeOptions.delay);
    }
    else {
      this._setSpeaking(active);
    }
  }

  // Private

  /**
   * Enable voice capture by detecting voice activity on the microphone.
   *
   * @param {Object} options
   * @return {Function}
   */
  _setupVoiceActivity(options) {
    let vad = new VAD(this.context, this.stream, options.threshold);
    vad.onProcess = (speaking, currentVolume) => {
      if (!this.mute) {
        this._setSpeaking(speaking);
      }
      if (this.onVoiceActivity) {
        this.onVoiceActivity(currentVolume);
      }
    };

    return () => {
      vad.stop();
      vad = null;

      this._setSpeaking(false);
    };
  }

  /**
   * Enable voice capture while holding down a specific hotkey.
   *
   * @param {Object} options
   * @return {Function}
   */
  _setupPushToTalk(options) {
    const shortcut = options['shortcut'];

    if (shortcut == null) return null;

    let combokeys = bindGlobal(new Combokeys(document));
    combokeys.bindGlobal(shortcut, e => {
      if (e.target === document.body) {
        e.preventDefault();
      }
      if (e.target.parentNode.classList.contains('shortcut-recorder')) {
        return;
      }
      this.setPTTActive(true);
    }, 'keydown');
    combokeys.bindGlobal(shortcut, e => {
      if (e.target === document.body) {
        e.preventDefault();
      }
      if (e.target.parentNode.classList.contains('shortcut-recorder')) {
        return;
      }
      this.setPTTActive(false);
    }, 'keyup');

    return () => {
      combokeys.reset();
      combokeys = null;

      this._setSpeaking(false);
    };
  }

  /**
   * Update whether speech is currently being played.
   *
   * @param {boolean} speaking
   */
  _setSpeaking(speaking) {
    if (this.speaking === speaking) return;
    this.speaking = speaking;
    this._updateAudioTracks();
    this.onSpeaking(speaking);
  }

  /**
   * Enables or disables all autio tracks based on current speaking status.
   */
  _updateAudioTracks() {
    if (platform.name === 'Chrome') {
      let speaking = this.mode === InputModes.VOICE_ACTIVITY ? !this.mute : this.speaking;
      if (this.stream != null) {
        let audioTracks = this.stream.getAudioTracks();
        for (let i = 0, l = audioTracks.length; i < l; i++) {
          audioTracks[i].enabled = speaking;
        }
      }
    }
  }
}



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/AudioInput.js
 **/
