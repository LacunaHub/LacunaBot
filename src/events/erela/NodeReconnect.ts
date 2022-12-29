import { Node } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, node: Node) => {
    self.logger.log(`[ErelaNodeReconnect] Attempt to reconnect to Node ${node.options.identifier}`)

    return true
}

export default {
    name: 'nodeReconnect',
    handler
}
