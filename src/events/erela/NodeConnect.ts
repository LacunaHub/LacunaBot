import { Node } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

async function handler(self: Lacuna, node: Node) {
    self.logger.log(`[ErelaNodeConnect] Successfully connected to ${node.options.identifier} node`)

    return true
}

export default {
    name: 'nodeConnect',
    handler
}
