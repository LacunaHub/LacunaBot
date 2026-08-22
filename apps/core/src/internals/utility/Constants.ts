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
