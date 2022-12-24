import { Node } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, node: Node, reason: { code: number; reason: string }) => {
    self.logger.warn(`[ErelaNodeDisconnect] Node ${node.options.identifier} disconnected with code ${reason.code}: ${reason.reason}`)

    return true
}

export default {
    name: 'nodeDisconnect',
    handler
}
