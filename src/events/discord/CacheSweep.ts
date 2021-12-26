import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, message: string) => {
    self.logger.info(`(Sweepers): ${message}`)

    return true
}

export default {
    name: 'cacheSweep',
    handler
}