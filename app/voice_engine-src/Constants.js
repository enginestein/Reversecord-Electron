import keyMirror from 'keymirror';
//import ConstantsIOS from './Constants.ios';

export const ActionTypes = keyMirror({
  USER_UPDATE: null,

  LOAD_REGIONS: null,

  LOAD_MESSAGES: null,
  LOAD_MESSAGES_SUCCESS: null,
  LOAD_MESSAGES_FAILURE: null,

  MESSAGE_CREATE: null,
  MESSAGE_SEND_FAILED: null,
  MESSAGE_UPDATE: null,
  MESSAGE_START_EDIT: null,
  MESSAGE_END_EDIT: null,
  MESSAGE_DELETE: null,
  MESSAGE_ACK: null,

  GUILD_UNAVAILABLE: null,

  GUILD_CREATE: null,
  GUILD_UPDATE: null,
  GUILD_DELETE: null,
  GUILD_EMOJIS_UPDATE: null,

  GUILD_SELECT: null,

  GUILD_MEMBERS_REQUEST: null,
  GUILD_MEMBERS_CHUNK: null,

  CHANGE_LOG_SHOW: null,

  CHANNEL_CREATE: null,
  CHANNEL_UPDATE: null,
  CHANNEL_DELETE: null,
  CHANNEL_SELECT: null,
  CHANNEL_ACK: null,
  CHANNEL_COLLAPSE: null,
  CHANNEL_COLLAPSE_MUTED: null,

  VOICE_CHANNEL_SELECT: null,
  VOICE_CHANNEL_CLEAR: null,

  TYPING_START: null,
  TYPING_STOP: null,

  NEW_USER_FLOW_SET_STEP: null,
  NEW_USER_FLOW_GUILD_UPDATE: null,
  NEW_USER_FLOW_GUILD_CREATED: null,
  NEW_USER_FLOW_GUILD_SUBMITTED: null,
  NEW_USER_FLOW_GUILD_FAILURE: null,

  START_SESSION: null,
  LOGIN: null,
  LOGIN_SUCCESS: null,
  LOGIN_FAILURE: null,
  REGISTER: null,
  REGISTER_SUCCESS: null,
  REGISTER_FAILURE: null,
  VERIFY_FAILURE: null,
  FORGOT_PASSWORD_SENT: null,
  LOGOUT: null,
  UPDATE_TOKEN: null,

  MODAL_PUSH: null,
  MODAL_POP: null,

  POPOUT_OPEN: null,
  POPOUT_CLOSE: null,

  TOOLTIP_SHOW: null,
  TOOLTIP_HIDE: null,

  TUTORIAL_INDICATOR_SHOW: null,
  TUTORIAL_INDICATOR_HIDE: null,
  TUTORIAL_INDICATOR_DISMISS: null,
  TUTORIAL_INDICATOR_SUPPRESS_ALL: null,

  UPLOAD_START: null,
  UPLOAD_PROGRESS: null,
  UPLOAD_COMPLETE: null,
  UPLOAD_FAIL: null,

  UPDATE_DIMENSIONS: null,

  CONNECTION_OPEN: null,
  CONNECTION_CLOSED: null,

  WINDOW_FOCUS: null,
  WINDOW_RESIZED: null,

  PRESENCE_UPDATE: null,

  VOICE_STATE_UPDATE: null,

  VOICE_SERVER_UPDATE: null,

  SPEAKING: null,

  AUDIO_SET_TEMPORARY_SELF_MUTE: null,
  AUDIO_TOGGLE_SELF_MUTE: null,
  AUDIO_TOGGLE_SELF_DEAF: null,
  AUDIO_TOGGLE_LOCAL_MUTE: null,
  AUDIO_TOGGLE_MUTE: null,
  AUDIO_TOGGLE_DEAF: null,
  AUDIO_ENABLE: null,
  AUDIO_SET_MODE: null,
  AUDIO_SET_INPUT_VOLUME: null,
  AUDIO_SET_OUTPUT_VOLUME: null,
  AUDIO_SET_LOCAL_VOLUME: null,
  AUDIO_SET_INPUT_DEVICE: null,
  AUDIO_SET_OUTPUT_DEVICE: null,
  AUDIO_SET_ECHO_CANCELLATION: null,
  AUDIO_SET_NOISE_SUPPRESSION: null,
  AUDIO_SET_AUTOMATIC_GAIN_CONTROL: null,
  AUDIO_SET_ATTENUATION: null,
  AUDIO_INPUT_DEVICES: null,
  AUDIO_OUTPUT_DEVICES: null,
  AUDIO_VOLUME_CHANGE: null,
  AUDIO_RESET: null,
  AUDIO_INPUT_DETECTED: null,

  USER_SETTINGS_UPDATE: null,

  USER_CONNECTIONS_UPDATE: null,
  USER_CONNECTIONS_INTEGRATION_JOINING: null,

  KEYBINDS_ADD_KEYBIND: null,
  KEYBINDS_SET_KEYBIND: null,
  KEYBINDS_DELETE_KEYBIND: null,
  KEYBINDS_ENABLE_ALL_KEYBINDS: null,

  NOTIFICATIONS_SET_DESKTOP_TYPE: null,
  NOTIFICATIONS_SET_TTS_TYPE: null,
  NOTIFICATIONS_SET_DISABLED_SOUNDS: null,

  IMAGE_LOAD_SUCCESS: null,
  IMAGE_LOAD_FAILURE: null,

  NOTICE_SHOW: null,
  NOTICE_DISMISS: null,

  VOICE_CONNECTION_STATE: null,
  VOICE_CONNECTION_SPEAKING: null,
  VOICE_CONNECTION_PING: null,
  VOICE_CONNECTION_SESSION_DESCRIPTION: null,

  IN_PROGRESS_TEXT_SAVE: null,

  INVITE_RESOLVE: null,
  INVITE_RESOLVE_SUCCESS: null,
  INVITE_RESOLVE_FAILURE: null,
  INVITE_ACCEPT: null,
  INVITE_ACCEPT_SUCCESS: null,
  INVITE_ACCEPT_FAILURE: null,
  INVITE_APP_OPENING: null,
  INVITE_APP_OPENED: null,
  INVITE_APP_NOT_OPENED: null,

  GUILD_BAN_ADD: null,
  GUILD_BAN_REMOVE: null,

  GUILD_MEMBER_ADD: null,
  GUILD_MEMBER_UPDATE: null,
  GUILD_MEMBER_REMOVE: null,

  GUILD_ROLE_CREATE: null,
  GUILD_ROLE_UPDATE: null,
  GUILD_ROLE_DELETE: null,

  GUILD_INTEGRATIONS_UPDATE: null,

  FEATURED_HELP_ARTICLES: null,

  CHECKING_FOR_UPDATES: null,
  UPDATE_NOT_AVAILABLE: null,
  UPDATE_AVAILABLE: null,
  UPDATE_ERROR: null,
  UPDATE_DOWNLOADED: null,

  RUNNING_GAMES_CHANGE: null,
  CANDIDATE_GAMES_CHANGE: null,
  OVERLAY_GAMES_CHANGE: null,

  IDLE: null,

  PERMISSION_CLEAR_VAD_WARNING: null,
  PERMISSION_CLEAR_SUPPRESS_WARNING: null,
  PERMISSION_CLEAR_PTT_ADMIN_WARNING: null,

  INSTANT_INVITE_CREATE: null,
  INSTANT_INVITE_CREATE_SUCCESS: null,
  INSTANT_INVITE_CREATE_FAILURE: null,

  INSTANT_INVITE_REVOKE_SUCCESS: null,

  INTEGRATION_QUERY: null,
  INTEGRATION_QUERY_SUCCESS: null,
  INTEGRATION_QUERY_FAILURE: null,

  OVERLAY_SET_ENABLED: null,
  OVERLAY_SELECT_GUILD: null,
  OVERLAY_OPEN_USER_POPOUT: null,
  OVERLAY_SET_DISPLAY_NAME_MODE: null,
  OVERLAY_SET_DISPLAY_USER_MODE: null,
  OVERLAY_SET_AVATAR_SIZE_MODE: null,
  OVERLAY_SET_POSITION: null,
  OVERLAY_SET_LOCKED: null,

  USER_GUILD_SETTINGS_UPDATE: null,

  // Custom Modals

  USER_SETTINGS_MODAL_OPEN: null,
  USER_SETTINGS_MODAL_CLOSE: null,
  USER_SETTINGS_MODAL_SUBMIT: null,
  USER_SETTINGS_MODAL_SUBMIT_FAILURE: null,
  USER_SETTINGS_MODAL_SET_SECTION: null,
  USER_SETTINGS_MODAL_UPDATE_ACCOUNT: null,

  CREATE_GUILD_MODAL_OPEN: null,
  CREATE_GUILD_MODAL_SET_SCREEN: null,
  CREATE_GUILD_MODAL_UPDATE: null,
  CREATE_GUILD_MODAL_CLOSE: null,
  CREATE_GUILD_MODAL_SUBMIT: null,
  CREATE_GUILD_MODAL_SUBMIT_FAILURE: null,
  JOIN_GUILD_MODAL: null,

  GUILD_SETTINGS_MODAL_OPEN: null,
  GUILD_SETTINGS_MODAL_CLOSE: null,
  GUILD_SETTINGS_MODAL_UPDATE: null,
  GUILD_SETTINGS_MODAL_SUBMIT: null,
  GUILD_SETTINGS_MODAL_SUBMIT_FAILURE: null,
  GUILD_SETTINGS_MODAL_SET_SECTION: null,
  GUILD_SETTINGS_MODAL_LOADED_BANS: null,
  GUILD_SETTINGS_MODAL_LOADED_INVITES: null,
  GUILD_SETTINGS_MODAL_LOADED_INTEGATIONS: null,
  GUILD_SETTINGS_MODAL_ROLE_SELECT: null,
  GUILD_SETTINGS_MODAL_SET_EMBED: null,

  NOTIFICATION_SETTINGS_MODAL_OPEN: null,
  NOTIFICATION_SETTINGS_MODAL_CLOSE: null,

  CREATE_CHANNEL_MODAL_OPEN: null,
  CREATE_CHANNEL_MODAL_CLOSE: null,
  CREATE_CHANNEL_MODAL_SUBMIT: null,
  CREATE_CHANNEL_MODAL_SUBMIT_FAILURE: null,

  CHANNEL_SETTINGS_MODAL_OPEN: null,
  CHANNEL_SETTINGS_MODAL_CLOSE: null,
  CHANNEL_SETTINGS_MODAL_UPDATE: null,
  CHANNEL_SETTINGS_MODAL_SUBMIT: null,
  CHANNEL_SETTINGS_MODAL_SUBMIT_FAILURE: null,
  CHANNEL_SETTINGS_MODAL_SET_SECTION: null,
  CHANNEL_SETTINGS_MODAL_OVERWRITE_SELECT: null,
  CHANNEL_SETTINGS_MODAL_LOADED_INVITES: null,

  USER_PROFILE_MODAL_OPEN: null,
  USER_PROFILE_MODAL_CLOSE: null,

  PRUNE_GUILD_MODAL_OPEN: null,
  PRUNE_GUILD_MODAL_CLOSE: null,

  STATUS_PAGE_INCIDENT: null,
  STATUS_PAGE_SCHEDULED_MAINTENANCE: null,
  STATUS_PAGE_SCHEDULED_MAINTENANCE_ACK: null,

  GUILD_VERIFICATION_CHECK: null,

  USER_SEARCH_QUERY: null,
  USER_SEARCH_SELECT: null,

  RUNNING_GAME_ADD_OVERRIDE: null,
  RUNNING_GAME_TOGGLE_BLOCK: null,
  RUNNING_GAME_TOGGLE_OVERLAY: null,
  RUNNING_GAME_EDIT_NAME: null,
  RUNNING_GAME_DELETE_ENTRY: null,

  // iOS

  ALERT_OPEN: null,
  ALERT_CLOSE: null,

  SCREEN_UPDATE: null,

  DRAWER_OPEN: null,
  DRAWER_CLOSE: null,
  DRAWER_DRAG_START: null,
  DRAWER_DRAG_END: null,
  DRAWER_ENABLE: null,
  DRAWER_DISABLE: null,

  KEYBOARD_SHOW: null,
  KEYBOARD_HIDE: null,

  APP_STATE_UPDATE: null
});

export const FormStates = keyMirror({
  OPEN: null,
  SUBMITTING: null,
  CLOSED: null
});

export const KeybindActions = keyMirror({
  UNASSIGNED: null,
  PUSH_TO_TALK: null,
  PUSH_TO_MUTE: null,
  TOGGLE_MUTE: null,
  TOGGLE_DEAFEN: null,
  TOGGLE_OVERLAY: null,
  TOGGLE_VOICE_MODE: null,
  TOGGLE_OVERLAY_INPUT_LOCK: null
});

export const UserSettingsModalSections = keyMirror({
  ACCOUNT: null,
  CONNECTIONS: null,
  TEXT: null,
  VOICE: null,
  VOICE_BASIC: null,
  VOICE_ADVANCED: null,
  NOTIFICATIONS: null,
  GAMES: null,
  KEYBINDS: null,
  APPEARANCE: null,
  OVERLAY: null,
  LOCALE: null
});

export const GuildSettingsModalSections = keyMirror({
  OVERVIEW: null,
  MEMBERS: null,
  ROLES: null,
  BANS: null,
  INSTANT_INVITES: null,
  EMBED: null,
  INTEGRATIONS: null
});

export const ChannelSettingsModalSections = keyMirror({
  OVERVIEW: null,
  PERMISSIONS: null,
  INSTANT_INVITES: null
});

export const DesktopNotificationTypes = keyMirror({
  NEVER: null,
  MENTIONS: null,
  ALL: null
});

export const TTSNotificationTypes = keyMirror({
  NEVER: null,
  ALL_CHANNELS: null,
  SELECTED_CHANNEL: null
});

export const InputModes = keyMirror({
  PUSH_TO_TALK: null,
  VOICE_ACTIVITY: null
});

export const ChannelTypes = {
  TEXT: 'text',
  VOICE: 'voice'
};

export const ThemeTypes = {
  DARK: 'dark',
  LIGHT: 'light'
};

export const NoticeTypes = keyMirror({
  GENERIC: null,
  UNCLAIMED_ACCOUNT: null,
  DOWNLOAD_NAG: null,
  VOICE_DISABLED: null,
  SCHEDULED_MAINTENANCE: null,
  CREATE_SERVER_NAG: null,
  NO_INPUT_DETECTED: null
});

export const InviteStates = keyMirror({
  RESOLVING: null,
  RESOLVED: null,
  EXPIRED: null,
  ACCEPTING: null,
  ACCEPTED: null,
  APP_OPENING: null,
  APP_OPENED: null,
  APP_NOT_OPENED: null
});

export const CreateGuildModalScreens = {
  Choose: 0,
  CreateGuild: 1,
  JoinGuild: 2
};

export const GuildFeatures = keyMirror({
  INVITE_SPLASH: null
});

export const VoiceConnectionStates = keyMirror({
  DISCONNECTED: null,
  AWAITING_ENDPOINT: null,
  AUTHENTICATING: null,
  CONNECTING: null,
  CONNECTED: null,
  VOICE_DISCONNECTED: null,
  VOICE_CONNECTING: null,
  VOICE_CONNECTED: null,
  NO_ROUTE: null,
  // WebRTC
  ICE_CHECKING: null
});

export const VoiceConnectionQuality = {
  UNKNOWN: 'unknown',
  BAD: 'bad',
  AVERAGE: 'average',
  FINE: 'fine'
};

export const MessageStates = keyMirror({
  SENT: null,
  SENDING: null,
  SEND_FAILED: null
});

export const OverlayDisplayNames = keyMirror({
  ALWAYS: null,
  NEVER: null,
  ONLY_WHILE_SPEAKING: null
});

export const OverlayDisplayUsers = keyMirror({
  ALWAYS: null,
  ONLY_WHILE_SPEAKING: null
});

export const OverlayAvatarSizes = {
  LARGE: 'large',
  SMALL: 'small'
};

export const StatusTypes = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  IDLE: 'idle'
};

export const TextareaTypes = {
  NORMAL: 'normal',
  EDIT: 'edit'
};

export const ProcessPriority = {
  LOW: 2,
  BELOW_NORMAL: 1,
  NORMAL: 0,
  ABOVE_NORMAL: -1,
  HIGH: -2
};

export const VerificationLevels = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3
};

export const VerificationCriteria = {
  ACCOUNT_AGE: 5,
  MEMBER_AGE: 10
};

export const Endpoints = {
  USER_CHANNELS: userId => `/users/${userId}/channels`,
  GUILD_CHANNELS: guildId => `/guilds/${guildId}/channels`,
  GUILD_MEMBERS: guildId => `/guilds/${guildId}/members`,
  GUILD_INTEGRATIONS: guildId => `/guilds/${guildId}/integrations`,
  GUILD_BANS: guildId => `/guilds/${guildId}/bans`,
  GUILD_ROLES: guildId => `/guilds/${guildId}/roles`,
  GUILD_INSTANT_INVITES: guildId => `/guilds/${guildId}/invites`,
  GUILD_EMBED: guildId => `/guilds/${guildId}/embed`,
  GUILD_PRUNE: guildId => `/guilds/${guildId}/prune`,
  GUILD_ICON: (guildId, hash) => `/guilds/${guildId}/icons/${hash}.jpg`,
  EMOJI: (emojiId) => `/emojis/${emojiId}.png`,
  GUILD_SPLASH: (guildId, hash) => `/guilds/${guildId}/splashes/${hash}.jpg`,
  GUILDS: '/guilds',
  CHANNELS: '/channels',
  AVATAR: (userId, hash) => `/users/${userId}/avatars/${hash}.jpg`,
  MESSAGES: channelId => `/channels/${channelId}/messages`,
  INSTANT_INVITES: channelId => `/channels/${channelId}/invites`,
  TYPING: channelId => `/channels/${channelId}/typing`,
  CHANNEL_PERMISSIONS: channelId => `/channels/${channelId}/permissions`,
  TUTORIAL: `/tutorial`,
  TUTORIAL_INDICATORS: `/tutorial/indicators`,
  USERS: '/users',
  ME: '/users/@me',
  DEVICES: '/users/@me/devices',
  SETTINGS: '/users/@me/settings',
  CONNECTIONS: '/users/@me/connections',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/auth/register',
  INVITE: '/invite',
  TRACK: '/track',
  SSO: '/sso',
  VERIFY: '/auth/verify',
  VERIFY_RESEND: '/auth/verify/resend',
  FORGOT_PASSWORD: '/auth/forgot',
  RESET_PASSWORD: '/auth/reset',
  REGIONS: guildId => guildId != null ? `/guilds/${guildId}/regions` : '/voice/regions',
  ICE: 'https://discordapp.com/api/voice/ice',
  REPORT: '/report',
  INTEGRATIONS: '/integrations',
  INTEGRATIONS_JOIN: integrationId => `/integrations/${integrationId}/join`,
  GATEWAY: '/gateway',
  USER_GUILD_SETTINGS: guildId => `/users/@me/guilds/${guildId}/settings`
};

export const Permissions = {
  // General
  CREATE_INSTANT_INVITE: 1 << 0,
  KICK_MEMBERS: 1 << 1,
  BAN_MEMBERS: 1 << 2,
  MANAGE_ROLES: 1 << 3,
  MANAGE_CHANNELS: 1 << 4,
  MANAGE_GUILD: 1 << 5,

  // Text
  READ_MESSAGES: 1 << 10,
  SEND_MESSAGES: 1 << 11,
  SEND_TSS_MESSAGES: 1 << 12,
  MANAGE_MESSAGES: 1 << 13,
  EMBED_LINKS: 1 << 14,
  ATTACH_FILES: 1 << 15,
  READ_MESSAGE_HISTORY: 1 << 16,
  MENTION_EVERYONE: 1 << 17,

  // Voice
  CONNECT: 1 << 20,
  SPEAK: 1 << 21,
  MUTE_MEMBERS: 1 << 22,
  DEAFEN_MEMBERS: 1 << 23,
  MOVE_MEMBERS: 1 << 24,
  USE_VAD: 1 << 25
};

export const UserNotificationSettings = {
  // Must be kept in sync with constants.py

  // Message notification
  ALL_MESSAGES: 0,
  ONLY_MENTIONS: 1,
  NO_MESSAGES: 2,
  NULL: 3
};

export const ME = '@me';

export const MAX_MESSAGES_PER_CHANNEL = 50;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_TTS_LENGTH = 200;

export const IDLE_DURATION = 1000 * 60 * 10; /* 10min */
export const TYPING_TIMEOUT = 10000;

export const MAX_ROLE_LENGTH = 32;

export const ChannelStreamTypes = keyMirror({
  MESSAGE_GROUP: null,
  DIVIDER_TIME_STAMP: null,
  DIVIDER_NEW_MESSAGES: null
});

export const AVATAR_SIZE = 128;
export const SPLASH_SIZE = 2048;

export const MAX_PTT_RELEASE_DELAY = 2000;

export const DEFAULT_INVITE_BUTTON_ID = 'DEFAULT_INVITE_BUTTON_ID';

export const CUSTOM_EMOJI = 'CUSTOM_EMOJI';

// iOS

//export const DrawerTypes = ConstantsIOS.DrawerTypes;
//export const AppStates = ConstantsIOS.AppStates;
//export const Colors = ConstantsIOS.Colors;
//export const Fonts = ConstantsIOS.Fonts;



/** WEBPACK FOOTER **
 ** ./discord_app/Constants.js
 **/
