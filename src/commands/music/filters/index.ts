import { PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.FilterCommand.Description',
    group: 'MUSIC',
    premium_only: true,
    permissions: {
        user: new PermissionsBitField(['ManageChannels']).toArray()
    }
}
