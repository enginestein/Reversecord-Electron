import Logger from '../../Logger';

export default class AudioOutput {
  constructor(id, stream) {
    this.id = id;

    this.logger = Logger.create(`AudioOutput(${this.id})`);

    this._speaking = false;
    this.onSpeaking = function() {};

    this._mute = false;
    this._volume = 100;

    let audio = document.createElement('audio');
    this._updateAudioElement(audio);
    audio.autoplay = true;
    audio.src = URL.createObjectURL(stream);
    this._audioElement = audio;

    this.logger.info(`create`);
  }

  /**
   * Destroys the AudioOutput.
   */
  destroy() {
    this.logger.info(`destroy`);

    this._stream = null;

    this._audioElement.pause();
    this._audioElement = null;

    this.speaking = false;
    this.onSpeaking = null;
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
    this._mute = mute || false;
    this._updateAudioElement();
  }

  /**
   * Return the current volume.
   *
   * @return {Number}
   */
  get volume() {
    return this._volume;
  }

  /**
   * Set the current volume.
   *
   * @param {Number} volume
   */
  set volume(volume) {
    // Audio Element does not allow going past 100% volume.
    this._volume = Math.min(Math.round(volume), 100);
    this._updateAudioElement();
  }

  /**
   * Determine if user is currently speaking.
   *
   * @return {boolean}
   */
  get speaking() {
    return this._speaking;
  }

  /**
   * Set whatever or not the user is currently speaking.
   *
   * @param {boolean} speaking
   */
  set speaking(speaking) {
    if (this._speaking === speaking) return;
    this._speaking = speaking;
    this.onSpeaking(speaking);
  }

  _updateAudioElement(audioElement) {
    audioElement = audioElement || this._audioElement;
    if (audioElement != null) {
      audioElement.muted = this._mute;
      audioElement.volume = this._volume / 100;
    }
  }
}



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/AudioOutput.js
 **/