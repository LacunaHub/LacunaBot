import { Node } from '@lacunahub/lavaluna.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, node: Node) => {
    self.logger.log(`[LavaNodeReconnect] Attempt to reconnect to Node ${node.options.name}`)

    return true
}

export default {
    name: 'nodeReconnect',
    handler
}
