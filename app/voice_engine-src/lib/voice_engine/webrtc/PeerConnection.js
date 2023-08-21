import {EventEmitter} from 'events';
import Logger from '../../Logger';
import SDP from './SDP';
import ICE from './ICE';
import platform from 'platform';

const logger = Logger.create('WebRTC');

let constraints;
if (platform.name === 'Firefox') {
  constraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: false
  };
}
else {
  constraints = {
    mandatory: {
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: false
    },
    optional: [
      {VoiceActivityDetection: true}
    ]
  };
}

export default class PeerConnection extends EventEmitter {
  constructor(ssrc, address, port, bitrate) {
    super();

    this.pc = null;

    this.address = address;
    this.port = port;

    this.bitrate = bitrate;

    this.ssrc = ssrc;
    this.remoteStreamHistory = [];
    this.remoteStreams = {};

    this.negotiationNeeded = false;
    this.negotiating = false;

    this.payloadType = null;

    this._stream = null;
    this._remoteSDP = null;

    this._safeExecuting = false;
    this._safeQueue = [];
  }

  /**
   * Initialize a RTCPeerConnection, gather ICE candidates and create an offer.
   */
  connect() {
    if (this.pc != null) return;

    ICE.getServers(iceServers => {
      let pc = new RTCPeerConnection({iceServers}, {
        optional: [
          {DtlsSrtpKeyAgreement: true}
        ]
      });
      pc.onicecandidate = this._handleIceCandidate.bind(this);
      pc.onnegotiationneeded = this._handleNegotiationNeeded.bind(this);
      pc.oniceconnectionstatechange = this._handleIceConnectionStateChange.bind(this);
      pc.onsignalingstatechange = this._handleSignalingStateChange.bind(this);
      pc.onaddstream = this._handleAddStream.bind(this);
      pc.onremovestream = this._handleRemoveStream.bind(this);
      this.pc = pc;
      if (this.stream) {
        pc.addStream(this.stream);
      }
      this._createLocalOffer((mode, streams) => {
        // Store this so when the remote SDP arrives the variables when it was
        // created are used to generate the remote description args.
        this._answerRemoteDescriptionArgs = ['answer', mode, streams];
      });
      this._iceGatheringTimeout = setTimeout(this._handleIceGatheringTimeout.bind(this), 5000);
    });
  }

  /**
   * Update the encoding bit rate.
   *
   * @param {Number} bitrate
   */
  setBitRate(bitrate) {
    this.bitrate = bitrate;
    this._fakeRemoteOffer();
  }

  /**
   * Close a RTCPeerConnection.
   */
  close() {
    clearTimeout(this._iceGatheringTimeout);

    if (this.pc != null) {
      let pc = this.pc;
      if (this.signalingState !== 'closed') {
        pc.close();
      }
      pc.onicecandidate = null;
      pc.onnegotiationneeded = null;
      pc.oniceconnectionstatechange = null;
      pc.onsignalingstatechange = null;
      pc.onaddstream = null;
      pc.onremovestream = null;
      this.pc = null;
    }
    else {
      ICE.stop();
    }
    this.removeAllListeners();
  }

  /**
   * Get ICE gathering state.
   *
   * @return {String}
   */
  get iceGatheringState() {
    return this.pc && this.pc.iceGatheringState;
  }

  /**
   * Get ICE connection state.
   *
   * @return {String}
   */
  get iceConnectionState() {
    return this.pc && this.pc.iceConnectionState;
  }

  /**
   * Get signaling state.
   *
   * @return {String}
   */
  get signalingState() {
    try {
      return this.pc && this.pc.signalingState;
    }
    catch (e) {
      // For some reason this throws `InvalidStateError` when you disconnect on Firefox.
      // Catch it and return "closed" to match what Chrome does.
      return 'closed';
    }
  }

  /**
   * Determine if RTCPeerConnection is successfully connected over ICE.
   *
   * @return {Boolean}
   */
  get connected() {
    return pc != null && /connected|completed/.test(this.pc.iceConnectionState);
  }

  //noinspection JSValidateJSDoc
  /**
   * Return the currently set local media stream. This can be not set if the connection
   * is receiving only.
   *
   * @return {MediaStream|null}
   */
  get stream() {
    return this._stream;
  }

  //noinspection JSValidateJSDoc
  /**
   * Set a MediaStream or unset the MediaStream.
   *
   * @param {MediaStream|null} stream
   */
  set stream(stream) {
    const isClosed = this.pc == null || this.signalingState === 'closed';

    if (this._stream != null && !isClosed) {
      this.pc.removeStream(this._stream);
    }

    this._stream = stream;

    if (stream != null && !isClosed) {
      this.pc.addStream(stream);
    }
  }

  /**
   * Set a new remote stream to the RTCPeerConnection.
   *
   * @param {String} cname
   * @param {Number} ssrc
   */
  setRemoteStream(cname, ssrc) {
    if (!this.remoteStreamHistory.some(stream => stream.ssrc === ssrc)) {
      this.remoteStreamHistory.push({ssrc, cname});
    }
    if (this.remoteStreams[cname] !== ssrc) {
      this.remoteStreams = {...this.remoteStreams, [cname]: ssrc};
      this._fakeRemoteOffer();
    }
  }

  /**
   * Remove a new remote stream from the RTCPeerConnection.
   *
   * @param {String} cname
   */
  removeRemoteStream(cname) {
    if (this.remoteStreams[cname] != null) {
      this.remoteStreams = {...this.remoteStreams};
      delete this.remoteStreams[cname];
      this._fakeRemoteOffer();
    }
  }

  /**
   * Get the currently set remote SDP on the connection.
   *
   * @return {String}
   */
  get remoteSDP() {
    return this._remoteSDP;
  }

  /**
   * Set an remote SDP on the connection. This has side-effects.
   *
   * @param {String} sdp
   */
  set remoteSDP(sdp) {
    this._remoteSDP = sdp;
    const args = this._answerRemoteDescriptionArgs;
    delete this._answerRemoteDescriptionArgs;
    this._updateRemoteDescription(...args);
  }

  // Private

  /**
   * Execute function if ICE connection is connected and singal state is stable.
   * Otherwise enqueue it.
   *
   * @param {Function} [func]
   */
  _safeExecute(func) {
    if (this.iceConnectionState === 'closed') {
      logger.info('safeExecute: ICE connection closed');
      return;
    }

    if (this._safeExecuting) {
      logger.info('safeExecute: currently executing');
      this._safeQueue.push(func);
    }
    else if (this.remoteSDP == null) {
      logger.info('safeExecute: awaiting remote SDP');
      this._safeQueue.push(func);
    }
    else if (this.signalingState !== 'stable') {
      logger.info('safeExecute: signaling state', this.signalingState);
      this._safeQueue.push(func);
    }
    else {
      this._safeExecuting = true;
      func();
    }
  }

  /**
   * Update the local description with an offer.
   *
   * @param {Function} [callback]
   */
  _createLocalOffer(callback) {
    const mode = this.stream != null ? SDP.SENDRECV : SDP.RECVONLY;
    const streams = this.remoteSDP != null ? this._getRemoteStreams() : [];
    this.pc.createOffer(
      offer => {
        this.payloadType = SDP.getOpusPayloadType(offer.sdp);
        this.pc.setLocalDescription(
          offer,
          () => {
            logger.info('createOffer+setLocalDescription success');
            callback && callback(mode, streams);
          },
          err => {
            throw err;
          }
        );
      },
      err => {
        throw err;
      },
      constraints
    );
  }

  /**
   * Update the local description with an answer.
   *
   * @param {Function} [callback]
   */
  _createLocalAnswer(callback) {
    this.pc.createAnswer(
      answer => {
        this.pc.setLocalDescription(
          answer,
          () => {
            logger.info('createAnswer+setLocalDescription success');
            callback && callback();
          },
          err => {
            throw err;
          }
        );
      },
      err => {
        throw err;
      },
      constraints
    );
  }

  /**
   * Update the remote description with a custom answer that merges all the remote streams.
   *
   * @param {String} type
   * @param {String} mode
   * @param {Array} streams
   * @param {Function} [callback]
   */
  _updateRemoteDescription(type, mode, streams, callback) {
    this.pc.setRemoteDescription(
      SDP.createSessionDescription(type, this.payloadType, this.remoteSDP, mode, streams, this.bitrate),
      () => {
        logger.info('setRemoteDescription success');
        callback && callback();
      },
      err => {
        throw err;
      }
    );
  }

  /**
   * Simulate a remote server offering new SSRCs.
   */
  _fakeRemoteOffer() {
    const streams = this._getRemoteStreams();

    this._safeExecute(() => {
      this._updateRemoteDescription('offer', this.stream != null ? SDP.SENDRECV : SDP.RECVONLY, streams, () => {
        this._createLocalAnswer();
      });
    });
  }

  /**
   * Get a copy of all the streams for the next remote description.
   *
   * @return {Array}
   */
  _getRemoteStreams() {
    return this.remoteStreamHistory.map(({cname, ssrc}) => [ssrc, cname, this.remoteStreams[cname] === ssrc]);
  }

  // RTCPeerConnection Event Handlers

  _handleNegotiationNeeded() {
    logger.info('negotiationNeeded');
    this._safeExecute(() => {
      this._createLocalOffer((mode, streams) => {
        this._updateRemoteDescription('answer', mode, streams);
      });
    });
  }

  _handleIceConnectionStateChange() {
    let connectionState = this.pc.iceConnectionState;
    logger.info('iceConnectionState =>', connectionState);
    if (connectionState === 'completed') {
      connectionState = 'connected';
    }
    this.emit(connectionState);
  }

  _handleSignalingStateChange() {
    logger.info('signalingState =>', this.pc.signalingState);
    if (this.pc.signalingState === 'stable') {
      this._safeExecuting = false;
      let func = this._safeQueue.shift();
      if (func != null) {
        logger.info('safeExecute: running queued function');
        this._safeExecute(func);
      }
    }
  }

  _handleAddStream(e) {
    if (!/^default/.test(e.stream.id)) {
      this.emit('addstream', e.stream.id.split('-')[0], e.stream);
    }
  }

  _handleRemoveStream(e) {
    if (!/^default/.test(e.stream.id)) {
      this.emit('removestream', e.stream.id.split('-')[0], e.stream);
    }
  }

  _handleIceGatheringTimeout() {
    if (this.pc.iceGatheringState !== 'complete') {
      logger.warn('ICE gathering never completed,');
      this._handleIceCandidate({candidate: null});
    }
  }

  _handleIceCandidate(e) {
    if (e.candidate == null && this._remoteSDP == null) {
      logger.info('ICE Ready');
      clearTimeout(this._iceGatheringTimeout);
      this.emit('offer', SDP.filterTCPCandidates(this.pc.localDescription.sdp));
    }
  }
}



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/PeerConnection.js
 **/