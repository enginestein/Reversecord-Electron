import debugInit from 'debug/browser';
import request from 'superagent/lib/client';

const debug = debugInit('SuperagentMonkeyPatch');

debug('monkeypatch superagent');

// Monkey-patch `superagent`
// * Automatically include token in Authorization header.
const originalEnd = request.Request.prototype.end;
request.Request.prototype.end = function() {
  debug(`request.end: ${window.fingerprint} ${window.token}`);
  //debug(`request.end: ${Array.prototype.slice.call(arguments)}`);

  const fingerprint = window.fingerprint;
  if (fingerprint) {
    this.set('X-Fingerprint', fingerprint);
  }
  this.set('Accept-Language', navigator.language);
  this.set('Authorization', window.token);
  const res = originalEnd.apply(this, arguments);
  debug(`request res: ${require('util').format(res)}`);
  return res;
};
