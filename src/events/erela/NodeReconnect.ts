import { Node } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, node: Node) => {
    self.logger.info(`(Player Manager): Node ${node.options.identifier} reconnected`)

    return true
}

export default {
    name: 'nodeReconnect',
    handler
}