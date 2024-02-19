import { Node } from 'lavaluna.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, node: Node, reason: { code: number; reason: string }) => {
    self.logger.warn(`[LavaNodeDisconnect] Node ${node.options.name} disconnected with code ${reason.code} ${reason.reason}`)

    return true
}

export default {
    name: 'nodeDisconnect',
    handler
}
