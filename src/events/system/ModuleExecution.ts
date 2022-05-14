import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, data: ModuleExecutionData) => {
    const { module, guild, target } = data

    self.logger.log(`(Module: ${module}): (${guild.name}:${guild.id}) (${target.name}:${target.id})`)
}

export default {
    name: 'moduleExecution',
    handler
}

export interface ModuleExecutionData {
    module: string
    guild: { name: string; id: string }
    target: { name: string; id: string }
}
