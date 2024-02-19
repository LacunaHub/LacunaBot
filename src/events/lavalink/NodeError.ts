import { Node } from 'lavaluna.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, node: Node, error: Error) => {
    self.logger.error(`[LavaNodeError] An error has occurred on node ${node.options.name}`, error?.stack ?? error?.message)

    return true
}

export default {
    name: 'nodeError',
    handler
}
