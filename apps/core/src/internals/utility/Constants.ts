import { createEnum } from './Utils.js'

export const commandOptionTypes = createEnum([
    null,
    'SubCommand',
    'SubCommandGroup',
    'String',
    'Integer',
    'Boolean',
    'User',
    'Channel',
    'Role',
    'Mentionable',
    'Number',
    'Attachment'
])

export const lavalinkSources = {
    Spotify: 'spsearch',
    YandexMusic: 'ymsearch',
    SoundCloud: 'scsearch'
}

export const emojiLetters = [
    '🇦',
    '🇧',
    '🇨',
    '🇩',
    '🇪',
    '🇫',
    '🇬',
    '🇭',
    '🇮',
    '🇯',
    '🇰',
    '🇱',
    '🇲',
    '🇳',
    '🇴',
    '🇵',
    '🇶',
    '🇷',
    '🇸',
    '🇹',
    '🇺',
    '🇻',
    '🇼',
    '🇽',
    '🇾',
    '🇿'
]

export const guildVerificationLevelNames = ['None', 'Low', 'Medium', 'High', 'VeryHigh']

export const supportServerId = process.env.LCN_SUPPORT_SERVER_ID!
export const projectTeamRoleId = process.env.LCN_PROJECT_TEAM_ROLE_ID!
export const subscribedPatronRoleId = process.env.LCN_SUBSCRIBED_PATRON_ROLE_ID!
export const activePatronRoleId = process.env.LCN_ACTIVE_PATRON_ROLE_ID!
export const longTermPatronRoleId = process.env.LCN_LONG_TERM_PATRON_ROLE_ID!
export const bigPatronRoleId = process.env.LCN_BIG_PATRON_ROLE_ID!
export const formerPatronRoleId = process.env.LCN_FORMER_PATRON_ROLE_ID!
export const serverBoosterRoleId = process.env.LCN_SERVER_BOOSTER_ROLE_ID!
export const newsChannelId = process.env.LCN_NEWS_CHANNEL_ID!
export const newsRoleId = process.env.LCN_NEWS_ROLE_ID!
