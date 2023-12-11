import { PermissionsBitField } from 'discord.js'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.StopCommand.Description',
    group: 'MUSIC',
    permissions: {
        user: new PermissionsBitField(['ManageChannels']).toArray()
    }
}
