import VoiceEngine from './index';
import {InputModes} from '../../../Constants';
import {NATIVE_TO_REGULAR} from './Constants';
import i18n from '../../../i18n';

export const LogType = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

class DiagnosticsContext {
  constructor() {
    this.logs = {};
    this.currentDiagnostic = null;
  }

  popDiagnostic() {
    this.currentDiagnostic = null;
  }

  pushDiagnostic(name) {
    this.currentDiagnostic = name;
    this.logs[name] = [];
  }

  diagnosticFailed(e) {
    this.logs[this.currentDiagnostic].push({message: `${e}`, type: LogType.ERROR});
    console.error(e);
    this.popDiagnostic();
  }

  addError(message, data) {
    this.logs[this.currentDiagnostic].push({message, data, type: LogType.ERROR});
  }

  addWarning(message, data) {
    this.logs[this.currentDiagnostic].push({message, data, type: LogType.WARNING});
  }

  addSuccess(message, data) {
    this.logs[this.currentDiagnostic].push({message, data, type: LogType.SUCCESS});
  }
}

const attrgetter = (k = null) => (obj, _k) => obj[k || _k];
const floatAlmostEquals = (a, b) => Math.abs(a - b) < 0.01;

const checkDevice = (diagDevice, storeDevice, context) => {
  if (diagDevice.index == storeDevice.index) {
    context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_DEVICE_SUCCESS_MATCHES, {
        key: 'index',
        value: diagDevice.index
      }
    );
  }
  else {
    context.addError(i18n.Messages.DIAGNOSTIC_CHECK_DEVICE_ERROR_MISMATCH, {
      key: 'index',
      expectedValue: storeDevice.index,
      nativeValue: diagDevice.index
    });
  }

  // Abort when device index is -1, it means we are using the default device,
  // and can't reliably compare device names, as the native diagnostics would return the name
  // of the default device rather than the literal string "Default".
  if (diagDevice.index === -1) return;

  const storeDeviceName = storeDevice.originalName || storeDevice.name;
  if (diagDevice.name == storeDeviceName) {
    context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_DEVICE_SUCCESS_MATCHES, {
      key: 'name',
      value: diagDevice.name
    });
  }
  else {
    context.addError(i18n.Messages.DIAGNOSTIC_CHECK_DEVICE_ERROR_MISMATCH, {
      key: 'name',
      expectedValue: storeDeviceName,
      nativeValue: diagDevice.name
    });
  }
};

function getChannelUserIds({SelectedChannelStore, AuthenticationStore, ChannelVoiceStateStore}) {
  const voiceChannelId = SelectedChannelStore.getVoiceChannelId();
  if (!voiceChannelId) {
    return false;
  }
  const voiceStates = ChannelVoiceStateStore.getVoiceStates(voiceChannelId);
  const myId = AuthenticationStore.getId();
  return new Set(voiceStates.map(({user}) => user.id).filter(userId => userId != myId));
}

const diagnostics = {
  ensureTransportOptionsMatchDiagnosticDataFlags: {
    name: i18n.Messages.DIAGNOSTIC_ENSURE_TRANSPORT_OPTIONS_MATCH_DIAGNOSTIC_DATA_FLAG_NAME,
    description: i18n.Messages.DIAGNOSTIC_ENSURE_TRANSPORT_OPTIONS_MATCH_DIAGNOSTIC_DATA_FLAG_DESCRIPTION,
    run(collectedDiagnostics, context) {
      const transportOptions = VoiceEngine.getTransportOptions();
      const diagFlags = collectedDiagnostics.Native.flags;

      const flagsToCompare = {
        agc: attrgetter('automaticGainControl'),
        attenuation: attrgetter(),
        attenuationFactor: attrgetter(),
        ducking: attrgetter(),
        echoCancellation: attrgetter(),
        inputMode: attrgetter(),
        noiseSuppression: attrgetter(),
        speakerVolume: attrgetter('outputVolume'),
        micVolume: attrgetter('inputVolume')
      };
      const equalityOverrides = {
        speakerVolume: floatAlmostEquals,
        micVolume: floatAlmostEquals,
        attenuationFactor: floatAlmostEquals
      };
      const defaultEquality = (a, b) => a === b;

      if (diagFlags.inputMode === InputModes.VOICE_ACTIVITY) {
        flagsToCompare.vadAutoThreshold = (o) => o.inputModeOptions.vadAutoThreshold;
        flagsToCompare.vadLeadin = (o) => o.inputModeOptions.vadLeadin;
        flagsToCompare.vadThreshold = (o) => o.inputModeOptions.vadThreshold;
        flagsToCompare.vadTrailin = (o) => o.inputModeOptions.vadTrailin;
      }

      for (let key of Object.keys(flagsToCompare)) {
        const diagValue = diagFlags[key];
        const optionsValue = flagsToCompare[key](transportOptions, key);
        const equalityFunction = equalityOverrides.hasOwnProperty(key) ? equalityOverrides[key] : defaultEquality;
        const isEqual = equalityFunction(diagValue, optionsValue);

        if (!isEqual) {
          context.addError(
            i18n.Messages.DIAGNOSTIC_ENSURE_TRANSPORT_OPTIONS_MATCH_DIAGNOSTIC_DATA_FLAG_ERROR_MISMATCH, {
              key,
              diagValue,
              optionsValue
            });
        }
        else {
          context.addSuccess(
            i18n.Messages.DIAGNOSTIC_ENSURE_TRANSPORT_OPTIONS_MATCH_DIAGNOSTIC_DATA_FLAG_SUCCESS_MATCHED,
            {
              key,
              diagValue,
              optionsValue
            });
        }
      }
    }
  },

  checkInputVolumeLevels: {
    name: i18n.Messages.DIAGNOSTIC_ENSURE_CHECK_INPUT_VOLUME_LEVELS_NAME,
    description: i18n.Messages.DIAGNOSTIC_ENSURE_CHECK_INPUT_VOLUME_LEVELS_DESCRIPTION,
    run(collectedDiagnostics, context) {
      const recentVolumes = collectedDiagnostics.Native.localUser.volumeDbFS;
      if (recentVolumes.length) {
        const averageVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
        if (averageVolume < -99.0) {
          context.addError(i18n.Messages.DIAGNOSTIC_ENSURE_CHECK_INPUT_VOLUME_LEVELS_ERROR_VOLUME_LOOKS_LOW, {
            averageVolume,
            recentVolumes
          });
        }
        else {
          context.addSuccess(i18n.Messages.DIAGNOSTIC_ENSURE_CHECK_INPUT_VOLUME_LEVELS_DETECTED_AUDIO_INPUT, {
            averageVolume,
            recentVolumes
          });
        }
      }
    }
  },

  checkPing: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_PING_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_PING_DESCRIPTION,
    run(collectedDiagnostics, context) {
      const PING_THRESHOLD = 250;

      const recentPings = collectedDiagnostics.Native.localUser.ping;
      if (recentPings.length) {
        const averagePing = recentPings.reduce((a, b) => a + b, 0) / recentPings.length;
        const maxPing = Math.max(...recentPings);

        // Test 2 kinds of pings -- check to see if their average is high in general.
        if (averagePing >= PING_THRESHOLD) {
          context.addError(i18n.Messages.DIAGNOSTIC_CHECK_PING_ERROR_HIGH_PING, {
            averagePing,
            recentPings
          });
        }
        // Or they had a spike recently.
        else if (maxPing >= PING_THRESHOLD) {
          context.addWarning(i18n.Messages.DIAGNOSTIC_CHECK_PING_WARNING_SPIKE, {
            averagePing,
            maxPing,
            recentPings
          });
        }
        else {
          context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_PING_NOMINAL, {
            averagePing,
            recentPings
          });
        }
      }
    }
  },

  checkInputDeviceMatches: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_INPUT_DEVICE_MATCHES_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_INPUT_DEVICE_MATCHES_DESCRIPTION,
    run(diagnosticData, context, {VoiceEngineStore}) {
      const inputDeviceId = VoiceEngineStore.getInputDeviceId();
      const inputDevices = VoiceEngineStore.getInputDevices();
      const inputDevice = inputDevices[inputDeviceId];
      const diagInputDevice = diagnosticData.Native.inputDevice;

      checkDevice(diagInputDevice, inputDevice, context);
    }
  },

  checkOutputDeviceMatches: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_OUTPUT_DEVICE_MATCHES_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_OUTPUT_DEVICE_MATCHES_DESCRIPTION,
    run(diagnosticData, context, {VoiceEngineStore}) {
      const outputDeviceId = VoiceEngineStore.getOutputDeviceId();
      const outputDevices = VoiceEngineStore.getOutputDevices();
      const outputDevice = outputDevices[outputDeviceId];
      const diagOutputDevice = diagnosticData.Native.outputDevice;

      checkDevice(diagOutputDevice, outputDevice, context);
    }
  },

  checkUserPackets: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_USER_PACKETS_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_USER_PACKETS_DESCRIPTION,
    run(diagnosticData, context, {ChannelVoiceStateStore, SelectedChannelStore, AuthenticationStore}) {
      const voiceChannelId = SelectedChannelStore.getVoiceChannelId();
      if (!voiceChannelId) {
        context.addWarning(i18n.Messages.DIAGNOSTIC_WARNING_NO_CHANNEL);
        return;
      }
      const voiceStates = ChannelVoiceStateStore.getVoiceStates(voiceChannelId);
      const wasUserSeen = {};
      const unknownUsers = [];
      const myId = AuthenticationStore.getId();
      voiceStates.forEach(({user}) => {
        if (user.id !== myId) {
          wasUserSeen[user.id] = false;
        }
      });

      const diagnosticUsers = diagnosticData.Native.users;
      diagnosticUsers.forEach(({id}) => {
        if (wasUserSeen.hasOwnProperty(id)) {
          wasUserSeen[id] = true;
        }
        else {
          unknownUsers.push(id);
        }
      });
      Object.keys(wasUserSeen).forEach(userId => {
        const userWasSeen = wasUserSeen[userId];
        if (userWasSeen) {
          context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_USER_PACKETS_USER_WAS_SEEN, {userId});
        }
        else {
          context.addWarning(i18n.Messages.DIAGNOSTIC_CHECK_USER_PACKETS_WARNING_NO_PACKET_SEEN, {
            userId
          });
        }
      });
      //for (let userId of unknownUsers) {
      //  context.addError(i18n.Messages.DIAGNOSTIC_CHECK_USER_PACKETS_ERROR_UNKNOWN_USER, {userId});
      //}
    }
  },

  checkUserVolumesMatch: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_USER_VOLUMES_MATCH_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_USER_VOLUMES_MATCH_DESCRIPTION,
    run(diagnosticData, context, stores) {
      const userIds = getChannelUserIds(stores);
      if (userIds === false) {
        context.addWarning(i18n.Messages.DIAGNOSTIC_WARNING_NO_CHANNEL);
        return;
      }
      const {VoiceEngineStore} = stores;
      const diagnosticUsers = diagnosticData.Native.users;
      const audioSettings = VoiceEngineStore.getAudioSettings();

      diagnosticUsers.forEach(user => {
        // Ignore users that aren't in the channel.
        if (!userIds.has(user.id))
          return;

        const userVolume = user.volume;
        // No overrides are present.
        if (!audioSettings.localVolumes.hasOwnProperty(user.id) && userVolume == 1) {
          context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_USER_VOLUMES_MATCH_NOMINAL, {
            userVolume,
            userId: user.id
          });
          return;
        }

        const localVolume = audioSettings.localVolumes[user.id] / 100;
        if (!floatAlmostEquals(localVolume, userVolume)) {
          context.addError(i18n.Messages.DIAGNOSTIC_CHECK_USER_VOLUMES_MATCH_ERROR_VOLUME_MISMATCH, {
            userVolume,
            localVolume,
            userId: user.id
          });
        }
        else {
          context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_USER_VOLUMES_MATCH_NOMINAL, {
            userVolume,
            userId: user.id
          });
        }
      });
    }
  },

  checkUserMutesMatch: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_USER_MUTES_MATCH_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_USER_MUTES_MATCH_DESCRIPTION,
    run(diagnosticData, context, stores) {
      const userIds = getChannelUserIds(stores);
      if (userIds === false) {
        context.addWarning(i18n.Messages.DIAGNOSTIC_WARNING_NO_CHANNEL);
        return;
      }
      const {VoiceEngineStore} = stores;
      const diagnosticUsers = diagnosticData.Native.users;
      const audioSettings = VoiceEngineStore.getAudioSettings();

      diagnosticUsers.forEach(user => {
        // Ignore users that aren't in the channel.
        if (!userIds.has(user.id))
          return;

        const localMuted = !!audioSettings.localMutes[user.id];
        const userMuted = user.muted;
        if (localMuted !== userMuted) {
          context.addError(i18n.Messages.DIAGNOSTIC_CHECK_USER_MUTES_ERROR_MISMATCH, {
            localMuted,
            userMuted,
            userId: user.id
          });
        }
        else {
          context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_USER_MUTES_NOMINAL, {
            userMuted,
            userId: user.id
          });
        }
      });
    }
  },

  checkLocalUser: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_LOCAL_USER_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_LOCAL_USER_DESCRIPTION,
    run(diagnosticData, context, {AuthenticationStore}) {
      const diagnosticUserId = diagnosticData.Native.localUser.id;
      const userId = AuthenticationStore.getId();
      if (userId != diagnosticUserId) {
        context.addError(i18n.Messages.DIAGNOSTIC_CHECK_LOCAL_USER_NOMINAL, {
          diagnosticUserId,
          userId
        });
      }
      else {
        context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_LOCAL_USER_NOMINAL, {
          userId
        });
      }
    }
  },

  checkUsersWhoHaveLowVolumes: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_DESCRIPTION,
    run(diagnosticData, context, stores) {
      const userIds = getChannelUserIds(stores);
      if (!userIds) {
        context.addWarning(i18n.Messages.DIAGNOSTIC_WARNING_NO_CHANNEL);
        return;
      }
      const audioSettings = stores.VoiceEngineStore.getAudioSettings();
      userIds.forEach(userId => {
        const localVolume = audioSettings.localVolumes[userId];
        if (localVolume === undefined) {
          context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_NOMINAL_NO_OVERRIDES, {
            userId
          });
        }
        else if (localVolume >= 50) {
          context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_NOMINAL, {
            userId,
            localVolume: localVolume | 0
          });
        }
        else if (localVolume >= 15) {
          context.addWarning(i18n.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_WARN_HARD_TO_HEAR, {
            userId,
            localVolume: localVolume | 0
          });
        }
        else if (localVolume >= 5) {
          context.addError(i18n.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_ERROR_HARD_TO_HEAR, {
            userId,
            localVolume: localVolume | 0
          });
        }
        else {
          context.addError(i18n.Messages.DIAGNOSTIC_CHECK_USERS_WHO_HAVE_LOW_VOLUMES_ERROR_TURN_THEM_UP, {
            userId,
            localVolume: localVolume | 0
          });
        }
      });
    }
  },

  checkUserMaybeMuted: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_USER_MAYBE_MUTED_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_USER_MAYBE_MUTED_DESCRIPTION,
    run(diagnosticData, context, stores) {
      const userIds = getChannelUserIds(stores);
      if (!userIds) {
        context.addWarning(i18n.Messages.DIAGNOSTIC_WARNING_NO_CHANNEL);
        return;
      }
      const audioSettings = stores.VoiceEngineStore.getAudioSettings();
      userIds.forEach(userId => {
        const localMuted = audioSettings.localMutes[userId];
        if (localMuted) {
          context.addWarning(i18n.Messages.DIAGNOSTIC_CHECK_USER_MAYBE_MUTED_WARN_USER_MUTED, {
            userId
          });
        }
        else {
          context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_USER_MAYBE_MUTED_NOMINAL, {
            userId
          });
        }
      });
    }
  },

  // jake: Shelved for now, I need to collect more info on acceptable values for these.
  //checkUserJitter: {
  //  run(diagnosticData, context) {
  //    // Check jitter.
  //  }
  //},
  //
  //checkUserPacketLoss: {
  //  run() {
  //    // Check user's packet loss rate.
  //  }
  //},
  //
  //checkUserPacketWaitingTimes: {
  //  run() {
  //    // Check whether packet waiting times exceed a given value.
  //  }
  //},

  checkUnknownSsrc: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_UNKNOWN_SSRC_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_UNKNOWN_SSRC_DESCRIPTION,
    run(diagnosticData, context) {
      const unknownUsers = diagnosticData.Native.unknownUsers;
      const userOptions = VoiceEngine.getUserOptions();
      const knownSsrc = {};
      userOptions.forEach(user => {
        knownSsrc[user.ssrc] = user;
      });

      if (unknownUsers.length > 0) {
        unknownUsers.forEach(({ssrc, bytesRx}) => {
          const userInfo = knownSsrc[ssrc];
          if (userInfo !== undefined) {
            context.addWarning(i18n.Messages.DIAGNOSTIC_CHECK_UNKNOWN_SSRC_WARNING_FORMERLY_UNKNOWN, {
              userId: userInfo.id,
              ssrc,
              bytesRx
            });
          }
          else {
            context.addError(i18n.Messages.DIAGNOSTIC_CHECK_UNKNOWN_SSRC_ERROR_UNKNOWN_SSRC_PACKETS_RECEIVED, {
              ssrc,
              bytesRx
            });
          }
        });
      }
      else {
        context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_UNKNOWN_SSRC_NOMINAL);
      }
    }
  },

  checkDecryptionFailures: {
    name: i18n.Messages.DIAGNOSTIC_CHECK_DECRYPTION_FAILURES_NAME,
    description: i18n.Messages.DIAGNOSTIC_CHECK_DECRYPTION_FAILURES_DESCRIPTION,
    run(diagnosticData, context) {
      const decryptionFailures = diagnosticData.Native.decryptionFailures;

      if (decryptionFailures > 0) {
        context.addError(i18n.Messages.DIAGNOSTIC_CHECK_DECRYPTION_FAILURES_ERROR_DETECTED_FAILURES, {
          decryptionFailures
        });
      }
      else {
        context.addSuccess(i18n.Messages.DIAGNOSTIC_CHECK_DECRYPTION_FAILURES_NOMINAL);
      }
    }
  }
};

const ALL_DIAGNOSTICS = Object.keys(diagnostics);

export function runDiagnostics(collectedDiagnostics, {
  VoiceEngineStore, ChannelVoiceStateStore, SelectedChannelStore, AuthenticationStore /* explicit about what stores we need */
  }, diagnosticsToRun = ALL_DIAGNOSTICS) {
  const context = new DiagnosticsContext();
  const stores = {VoiceEngineStore, ChannelVoiceStateStore, SelectedChannelStore, AuthenticationStore};

  for (let diagnosticKey of diagnosticsToRun) {
    const diagnostic = diagnostics[diagnosticKey];
    context.pushDiagnostic(diagnosticKey);
    try {
      diagnostic.run(collectedDiagnostics, context, stores);
      context.popDiagnostic();
    } catch (e) {
      context.diagnosticFailed(e);
    }
  }
  return {diagnosticsRan: diagnosticsToRun, logs: context.logs};
}

export function getDiagnosticInfo(diagnosticKey) {
  const diagnostic = diagnostics[diagnosticKey];
  if (diagnostic === undefined) return null;

  return {
    name: diagnostic.name,
    description: diagnostic.description
  };
}



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/native/Diagnostics.js
 **/