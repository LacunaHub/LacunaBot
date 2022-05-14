import prefix from './prefix'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    prefix,
    name,
    description: 'JavaScript песочница',
    private: true,
    group: 'UTILITY'
}
