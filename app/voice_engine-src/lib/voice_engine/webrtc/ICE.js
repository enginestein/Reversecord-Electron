import {Endpoints} from '../../../Constants';
import Storage from '../../Storage';
import request from 'superagent/lib/client';

const ICE_KEY = 'ice';
const SERVER_DELAY = 5000;

let retries = 0;
let timeout = null;

function loadServers() {
  const ice = Storage.get(ICE_KEY);
  return ice && ice.expires > Date.now() ? ice.servers : null;
}

function persistServers(servers, ttl=60 * 60 * 24) {
  Storage.set(ICE_KEY, {
    servers,
    expires: Date.now() + (ttl * 1000) - SERVER_DELAY
  });
}

export default {
  /**
   * Get a list of STUN and TURN servers to use for a PeerConnection.
   *
   * @param {Function} callback
   */
  getServers(callback) {
    clearTimeout(timeout);

    let servers = loadServers();
    if (servers != null) {
      // Force this action to always be async.
      timeout = setTimeout(() => callback(servers), 0);
    }
    else {
      request
        .get(Endpoints.ICE)
        .end((err, res) => {
          if (res.ok) {
            servers = res.body.servers;
            persistServers(servers, res.body['ttl']);
            callback(servers);
          }
          else {
            timeout = setTimeout(() => this.getServers(callback), 1000 * Math.min(++retries, 30));
          }
        });
    }
  },

  /**
   * Clear any pending timeouts.
   */
  stop() {
    clearTimeout(timeout);
  }
};



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/webrtc/ICE.js
 **/
