import Lacuna from '@/internals/Lacuna.js'

const handler = async (self: Lacuna, data: ModuleExecutionData) => {
    const { guildId, targetId, module, category, label } = data
    self.logger.info({ guildId, targetId, module, category, label }, 'module execution')

    return true
}

export default {
    name: 'moduleExecution',
    handler
}

export interface ModuleExecutionData {
    guildId: string
    targetId: string
    module: string
    category?: string
    label?: string
}
