import Lacuna from '@/internals/Lacuna.js'
import { Node } from '@lacunahub/lavaluna.js'

const handler = async (self: Lacuna, node: Node, error: any) => {
    self.logger.error({ nodeName: node.options.name, error }, 'lavalink node error')

    return true
}

export default {
    name: 'nodeError',
    handler
}
