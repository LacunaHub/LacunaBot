import { Node } from '@lacunahub/lavaluna.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, node: Node, reason: { code: number; reason: string }) => {
    self.logger.warn({ nodeName: node.options.name, reason }, 'lavalink node disconnected')

    return true
}

export default {
    name: 'nodeDisconnect',
    handler
}
