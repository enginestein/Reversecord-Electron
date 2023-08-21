//noinspection JSValidateJSDoc
/**
 * Determine max volume in the history.
 *
 * @param {AnalyserNode} analyser
 * @param {Float32Array} fftBins
 * @return {Number}
 */
function getMaxVolume(analyser, fftBins) {
  let maxVolume = -Infinity;
  analyser.getFloatFrequencyData(fftBins);
  for (let i = 4; i < fftBins.length; i++) {
    if (fftBins[i] > maxVolume && fftBins[i] < 0) {
      maxVolume = fftBins[i];
    }
  }
  return maxVolume;
}

export default class VAD {
  constructor(context, stream, threshold=-40, smoothing=0.1, history=10) {
    let analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = smoothing;

    let source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    let speakingHistory = [];
    for (let i = 0; i < history; i++) {
      speakingHistory.push(false);
    }

    let processor = context.createScriptProcessor(1024, 0, 1);
    processor.onaudioprocess = () => {
      this.update();
      if (this.onProcess) {
        this.onProcess(this.speaking, this.currentVolume);
      }
    };
    processor.connect(context.destination);

    this.threshold = threshold;
    this.analyser = analyser;
    this.processor = processor;
    this.fftBins = new Float32Array(analyser.fftSize);
    this.source = source;
    this.currentVolume = 0;
    this.speakingHistory = speakingHistory;
    this.speakingHistoryIndex = 0;
    this.speakingCounter = 0;

    this.silenceThreshold = this.speakingHistory.length * 4;
    this.silentFrames = this.silenceThreshold;

    this.onProcess = null;
  }

  /**
   * Whether or not the stream currently has speech.
   *
   * @return {Boolean}
   */
  get speaking() {
    return this.speakingCounter > 0 ? true : this.silentFrames < this.silenceThreshold;
  }

  /**
   * Updates the speaking history.
   */
  update() {
    this.currentVolume = getMaxVolume(this.analyser, this.fftBins);

    // Reduce speaking counter.
    if (this.speakingHistory[this.speakingHistoryIndex]) {
      this.speakingCounter--;
    }

    // Increase speaking counter if frame has speech.
    const hasSpeech = this.currentVolume > this.threshold;
    this.speakingHistory[this.speakingHistoryIndex] = hasSpeech;
    if (hasSpeech) {
      this.speakingCounter++;
    }

    // Loop around...
    if (++this.speakingHistoryIndex === this.speakingHistory.length) {
      this.speakingHistoryIndex = 0;
    }

    if (this.speakingCounter > 0) {
      this.silentFrames = 0;
    }
    else {
      this.silentFrames++;
    }
  }

  /**
   * Disconnect nodes and perform cleanup.
   */
  stop() {
    this.source.disconnect();
    this.processor.disconnect();
    this.speakingCounter = 0;
  }
}



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/VAD.js
 **/