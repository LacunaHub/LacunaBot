import { Node } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

async function handler(self: Lacuna, node: Node) {
    self.logger.info(`(Player Manager): Node ${node.options.identifier} successfully connected`)

    return true
}

export default {
    name: 'nodeConnect',
    handler
}
