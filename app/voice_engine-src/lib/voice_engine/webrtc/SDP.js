import platform from 'platform';

const SENDRECV = 'sendrecv';
const RECVONLY = 'sendonly';

function concatSDP(...parts) {
  return parts.join('\n').trim() + '\n';
}

function transformCandidates(sdp, payloadType) {
  return sdp.replace('ICE/SDP', `RTP/SAVPF ${payloadType}`).trim();
}

let generateSDP;
if (platform.name === 'Firefox') {
  const DEFAULT_STREAM = [0, 'default', true];

  generateSDP = (type, payloadType, candidates, mode, streams, bitrate) => {
    candidates = transformCandidates(candidates, payloadType);

    streams = [DEFAULT_STREAM, ...streams];

    const bundles = streams.map((_, i) => `sdparta_${i}`).join(' ');

    const mlines = streams.map(([ssrc, cname, active], i) => {
      if (active) {
        return `${candidates}
a=${mode === SENDRECV && i === 0 ? 'sendrecv' : 'sendonly'}
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=mid:sdparta_${i}
b=AS:${bitrate}
a=msid:${cname}-${ssrc} ${cname}-${ssrc}
a=rtcp-mux
a=rtpmap:${payloadType} opus/48000/2
a=setup:actpass
a=ssrc:${ssrc} cname:${cname}-${ssrc}`;
      }
      else {
        return `m=audio 0 RTP/SAVPF ${payloadType}
c=IN IP4 0.0.0.0
a=inactive
a=rtpmap:${payloadType} NULL/0`;
      }
    });

    return concatSDP(
      `v=0
o=mozilla...THIS_IS_SDPARTA 6054093392514871408 0 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE ${bundles}
a=msid-semantic:WMS *`,
      ...mlines
    );
  };
}
else {
  generateSDP = (type, payloadType, candidates, mode, streams, bitrate) => {
    let ssrcs = streams
      .filter(([ssrc, cname, active]) => active)
      .map(([ssrc, cname]) => {
        return `a=ssrc:${ssrc} cname:${cname}
a=ssrc:${ssrc} msid:${cname} ${cname}`;
      });
    return concatSDP(
      `v=0
o=- 6054093392514871408 3 IN IP4 127.0.0.1
s=-
t=0 0
a=setup:${type === 'answer' ? 'passive' : 'actpass'}`,
      transformCandidates(candidates, payloadType),
      `a=rtcp-mux
a=mid:audio
b=AS:${bitrate}
a=${mode == SENDRECV ? 'sendrecv' : 'sendonly'}
a=rtpmap:${payloadType} opus/48000/2
a=fmtp:${payloadType} minptime=10; useinbandfec=1
a=maxptime:60`,
      ...ssrcs
    );
  };
}

export default {
  SENDRECV: SENDRECV,
  RECVONLY: RECVONLY,

  /**
   * Get the Opus payload type from SDP.
   *
   * @param {String} sdp
   * @return {string}
   */
  getOpusPayloadType(sdp) {
    return sdp.match(/a=rtpmap:(\d+) opus/)[1];
  },

  /**
   * Create custom session description.
   *
   * @param {String} type
   * @param {String} payloadType
   * @param {String} candidates
   * @param {String} mode
   * @param {Array<Array>} streams
   * @param {Number} bitrate
   * @return {RTCSessionDescription}
   */
  createSessionDescription(type, payloadType, candidates, mode, streams, bitrate) {
    return new RTCSessionDescription({
      type: type,
      sdp: generateSDP(type, payloadType, candidates, mode, streams, (bitrate || 40000) / 1000)
    });
  },

  /**
   * Remove all TCP candidates from the SDP.
   *
   * @param {String} sdp
   * @return {String}
   */
  filterTCPCandidates(sdp) {
    return sdp
      .replace(/\r/g, '')
      .split('\n')
      .map(line => {
        if (!/^a=candidate:/.test(line)) {
          return line;
        }

        let tokens = line.split(' ');
        tokens = tokens.slice(0, 2).concat([tokens[2].toUpperCase(), ...tokens.slice(3)]);

        if (tokens[2] === 'TCP') {
          return null;
        }

        return tokens.join(' ');
      })
      .filter(line => line != null)
      .join('\n');
  }
};



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/SDP.js
 **/