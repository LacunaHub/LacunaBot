import prefix from './prefix'
import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    prefix,
    slash,
    name,
    description: `commands.${name}.description`,
    group: 'GENERAL',
    permissions: {
        self: ['EMBED_LINKS']
    }
}
