import { Node } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, node: Node, error: Error) => {
    self.logger.info(`(Player Manager): An error has occurred on node ${node.options.identifier}`, error?.stack ?? error?.message)

    return true
}

export default {
    name: 'nodeError',
    handler
}