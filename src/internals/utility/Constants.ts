import { createEnum } from './Utils'

export const commandOptionTypes = createEnum([
    null,
    'SUB_COMMAND',
    'SUB_COMMAND_GROUP',
    'STRING',
    'INTEGER',
    'BOOLEAN',
    'USER',
    'CHANNEL',
    'ROLE',
    'MENTIONABLE',
    'NUMBER'
])

export const lavalinkSources = {
    Spotify: 'spsearch',
    YandexMusic: 'ymsearch',
    SoundCloud: 'scsearch'
}
