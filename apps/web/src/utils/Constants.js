export const metaTitleTemplate = title => (title ? `${title} – Lacuna` : 'Lacuna – Discord Bot')

export const imButtonStyles = {
    PRIMARY: '#5865F2',
    SECONDARY: '#4F545C',
    SUCCESS: '#43B581',
    DANGER: '#F04747',
    LINK: '#4F545C'
}

export const discordPermissions = {
    CREATE_INSTANT_INVITE: 1 << 0,
    KICK_MEMBERS: 1 << 1,
    BAN_MEMBERS: 1 << 2,
    ADMINISTRATOR: 1 << 3,
    MANAGE_CHANNELS: 1 << 4,
    MANAGE_GUILD: 1 << 5,
    ADD_REACTIONS: 1 << 6,
    VIEW_AUDIT_LOG: 1 << 7,
    PRIORITY_SPEAKER: 1 << 8,
    STREAM: 1 << 9,
    VIEW_CHANNEL: 1 << 10,
    SEND_MESSAGES: 1 << 11,
    SEND_TTS_MESSAGES: 1 << 12,
    MANAGE_MESSAGES: 1 << 13,
    EMBED_LINKS: 1 << 14,
    ATTACH_FILES: 1 << 15,
    READ_MESSAGE_HISTORY: 1 << 16,
    MENTION_EVERYONE: 1 << 17,
    USE_EXTERNAL_EMOJIS: 1 << 18,
    VIEW_GUILD_INSIGHTS: 1 << 19,
    CONNECT: 1 << 20,
    SPEAK: 1 << 21,
    MUTE_MEMBERS: 1 << 22,
    DEAFEN_MEMBERS: 1 << 23,
    MOVE_MEMBERS: 1 << 24,
    USE_VAD: 1 << 25,
    CHANGE_NICKNAME: 1 << 26,
    MANAGE_NICKNAMES: 1 << 27,
    MANAGE_ROLES: 1 << 28,
    MANAGE_WEBHOOKS: 1 << 29,
    MANAGE_EMOJIS_AND_STICKERS: 1 << 30,
    USE_APPLICATION_COMMANDS: 1 << 31,
    REQUEST_TO_SPEAK: 1 << 32,
    MANAGE_THREADS: 1 << 34,
    USE_PUBLIC_THREADS: 1 << 35,
    USE_PRIVATE_THREADS: 1 << 36,
    USE_EXTERNAL_STICKERS: 1 << 37,
    SEND_MESSAGES_IN_THREADS: 1 << 38,
    START_EMBEDDED_ACTIVITIES: 1 << 39,
    MODERATE_MEMBERS: 1 << 40
}

export const discordChannelPermissions = {
    CREATE_INSTANT_INVITE: 1 << 0,
    MANAGE_CHANNELS: 1 << 4,
    ADD_REACTIONS: 1 << 6,
    PRIORITY_SPEAKER: 1 << 8,
    STREAM: 1 << 9,
    VIEW_CHANNEL: 1 << 10,
    SEND_MESSAGES: 1 << 11,
    SEND_TTS_MESSAGES: 1 << 12,
    MANAGE_MESSAGES: 1 << 13,
    EMBED_LINKS: 1 << 14,
    ATTACH_FILES: 1 << 15,
    READ_MESSAGE_HISTORY: 1 << 16,
    MENTION_EVERYONE: 1 << 17,
    USE_EXTERNAL_EMOJIS: 1 << 18,
    CONNECT: 1 << 20,
    SPEAK: 1 << 21,
    MUTE_MEMBERS: 1 << 22,
    DEAFEN_MEMBERS: 1 << 23,
    MOVE_MEMBERS: 1 << 24,
    USE_VAD: 1 << 25,
    MANAGE_WEBHOOKS: 1 << 29,
    USE_APPLICATION_COMMANDS: 1 << 31,
    REQUEST_TO_SPEAK: 1 << 32,
    MANAGE_THREADS: 1 << 34,
    USE_PUBLIC_THREADS: 1 << 35,
    USE_PRIVATE_THREADS: 1 << 36,
    USE_EXTERNAL_STICKERS: 1 << 37,
    SEND_MESSAGES_IN_THREADS: 1 << 38
}

export const discordAppCommandNameRegexp = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u

export const customCommandComponentLimits = {
    COMPARE_VALUES: 5,
    REPLY: 1,
    SEND_MESSAGE: 2,
    MODIFY_ROLES: 2,
    FORWARD_TO_COMMAND: 1,
    MODIFY_WALLET: 2
}

export const availableLocales = [
    { label: 'English', value: 'en' },
    { label: 'Русский', value: 'ru' },
    { label: 'Українська', value: 'uk' }
]
