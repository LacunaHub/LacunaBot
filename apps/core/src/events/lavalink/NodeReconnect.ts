import Lacuna from '@/internals/Lacuna.js'
import { Node } from '@lacunahub/lavaluna.js'

const handler = async (self: Lacuna, node: Node) => {
    self.logger.info({ nodeName: node.options.name }, 'reconnecting to lavalink node')

    return true
}

export default {
    name: 'nodeReconnect',
    handler
}
