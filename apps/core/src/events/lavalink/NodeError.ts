import { Node } from '@lacunahub/lavaluna.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, node: Node, error) => {
    self.logger.error({ nodeName: node.options.name, error }, 'lavalink node error')

    return true
}

export default {
    name: 'nodeError',
    handler
}
