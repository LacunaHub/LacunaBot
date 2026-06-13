import { Node } from '@lacunahub/lavaluna.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, node: Node) => {
    self.logger.info({ nodeName: node.options.name }, 'reconnecting to lavalink node')

    return true
}

export default {
    name: 'nodeReconnect',
    handler
}
