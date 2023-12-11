import slash from './slash'

const name = __dirname.split(/\\/).pop().split('/').pop()

export default {
    slash,
    name,
    description: 'Commands.QueueCommand.Description',
    group: 'MUSIC'
}
