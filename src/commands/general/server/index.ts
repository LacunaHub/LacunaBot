import { PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.ServerCommand.Description',
    group: 'GENERAL',
    permissions: {
        self: new PermissionsBitField(['EmbedLinks']).toArray()
    }
}
