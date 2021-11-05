const prefix = require('./prefix')

const name = __dirname.split(/\\/).pop().split('/').pop()

module.exports = {
    prefix,
    name,
    description: 'JavaScript песочница',
    private: true,
    group: 'UTILITY'
}