import {InputModes, VoiceConnectionStates, ProcessPriority} from '../../../Constants';

export const EchoCancellation = {
  DISABLED: -1,
  UNCHANGED: 0, // previously set mode
  DEFAULT: 1, // platform default
  CONFERANCE: 2, // coferencing default (aggressive AEC)
  AEC: 3, // Acoustic Echo Cancellation
  AECM: 4 // AEC mobile
};

//noinspection JSUnusedGlobalSymbols
export const AECMobile = {
  QUIET_EARPIECE_OR_HEADSET: 0, // Quiet earpiece of headset use
  EARPIECE: 1, // most earpiece use
  LOUD_EARPIECE: 2, // loud earpiece or quiet speakerphone use
  SPEAKERPHONE: 3, // most speakerphone use (default)
  LOUD_SPEAKERPHONE: 4 // Loud speakerphone
};

export const AutomaticGainControl = {
  DISABLED: -1,
  UNCHANGED: 0, // previously set mode
  DEFAULT: 1, // platform default
  ADAPTIVE_ANALOG: 2, // adaptive mode for use when analog volume control exists (e.g. for PC softphone)
  ADAPTIVE_DIGITAL: 3, // scaling takes place in the digital domain (e.g. for conference servers and embedded devices)
  FIXED_DIGITAL: 4 // can be used on embedded devices where the capture signal level is predictable
};

export const NoiseSuppression = {
  DISABLED: -1,
  UNCHANGED: 0, // previously set mode
  DEFAULT: 1, // platform default
  CONFERENCE: 2, // conferencing default
  LOW_SUPPRESSION: 3, // lowest suppression
  MODERATE_SUPPRESSION: 4,
  HIGH_SUPPRESSION: 5,
  VERY_HIGH_SUPPRESSION: 6 // highest suppression
};

export const VADAggressiveness = {
  DISABLED: -1,
  NORMAL: 0,
  LOW_BIRTATE: 1,
  AGGRESSIVE: 2,
  VERY_AGGRESSIVE: 3
};

export const NATIVE_MODE_VALUES = {
  [InputModes.VOICE_ACTIVITY]: 1,
  [InputModes.PUSH_TO_TALK]: 2
};

export const NATIVE_TO_REGULAR = {
  [NATIVE_MODE_VALUES[InputModes.VOICE_ACTIVITY]]: InputModes.VOICE_ACTIVITY,
  [NATIVE_MODE_VALUES[InputModes.PUSH_TO_TALK]]: InputModes.PUSH_TO_TALK
};

export const EchoCancellationToHumanReadable = {
  [EchoCancellation.DISABLED]: `Disabled`,
  [EchoCancellation.UNCHANGED]: `Unchanged`,
  [EchoCancellation.DEFAULT]: `Platform Default`,
  [EchoCancellation.CONFERANCE]: `Conferencing Default (Aggressive AEC)`,
  [EchoCancellation.AEC]: `Automatic Echo Cancellation`,
  [EchoCancellation.AECM]: `Automatic Echo Cancellation Mobile`
};

export const AutomaticGainControlToHumanReadable = {
  [AutomaticGainControl.DISABLED]: `Disabled`,
  [AutomaticGainControl.UNCHANGED]: `Unchanged`,
  [AutomaticGainControl.DEFAULT]: `Platform Default`,
  [AutomaticGainControl.ADAPTIVE_ANALOG]: `Adaptive Analog`,
  [AutomaticGainControl.ADAPTIVE_DIGITAL]: `Adaptive Digital`,
  [AutomaticGainControl.FIXED_DIGITAL]: `Fixed Digital`
};

export const NoiseSuppressionToHumanReadable = {
  [NoiseSuppression.DISABLED]: `Disabled`,
  [NoiseSuppression.UNCHANGED]: `Unchanged`,
  [NoiseSuppression.DEFAULT]: `Platform Default`,
  [NoiseSuppression.CONFERENCE]: `Conferencing Default`,
  [NoiseSuppression.LOW_SUPPRESSION]: `Lowest Suppression`,
  [NoiseSuppression.MODERATE_SUPPRESSION]: `Moderate Suppression`,
  [NoiseSuppression.HIGH_SUPPRESSION]: `High Suppression`,
  [NoiseSuppression.VERY_HIGH_SUPPRESSION]: `Very High Suppression`
};

export const VADAggressivenessToHumanReadable = {
  [VADAggressiveness.DISABLED]: `Disabled`,
  [VADAggressiveness.NORMAL]: `Normal`,
  [VADAggressiveness.LOW_BIRTATE]: `Low Bitrate`,
  [VADAggressiveness.AGGRESSIVE]: `Aggressive`,
  [VADAggressiveness.VERY_AGGRESSIVE]: `Very Aggressive`
};

export const InputModeToHumanReadable = {
  [NATIVE_MODE_VALUES[InputModes.VOICE_ACTIVITY]]: `Voice Activity`,
  [NATIVE_MODE_VALUES[InputModes.PUSH_TO_TALK]]: `Push To Talk`
};



/** WEBPACK FOOTER **
 ** ./discord_app/lib/voice_engine/native/Constants.js
 **/