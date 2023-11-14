import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: `commands.${name}.description`,
    group: 'MUSIC',
    premium_only: true,
    permissions: {
        user: ['MANAGE_CHANNELS']
    }
}
