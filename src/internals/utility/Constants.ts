import { createEnum } from './Utils'

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
