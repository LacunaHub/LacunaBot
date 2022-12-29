import Lacuna from '../../internals/Lacuna'
import logger from '../../internals/Logger'

const handler = async (self: Lacuna, data: ModuleExecutionData) => {
    handleModuleExecutionData(data)

    return true
}

export function handleModuleExecutionData(data: ModuleExecutionData) {
    const { module, category, label, guild, target } = data
    // const moduleStats = qdb.get(`stats.modules.${module}`)

    // if (moduleStats) {
    //     qdb.push(`stats.modules.${module}.data`, {
    //         timestamp: Date.now(),
    //         category,
    //         label: label ?? null,
    //         guild_id: guild.id,
    //         target_id: target.id
    //     })
    //     qdb.add(`stats.modules.${module}.total_uses`, 1)
    // } else {
    //     qdb.set(`stats.modules.${module}`, {
    //         module,
    //         data: [
    //             {
    //                 timestamp: Date.now(),
    //                 category: category ?? null,
    //                 label: label ?? null,
    //                 guild_id: guild.id,
    //                 target_id: target.id
    //             }
    //         ],
    //         total_uses: 1
    //     })
    // }

    logger.log(`[${module}${category ?? ''}Module] Execution from (${guild.name}:${guild.id}) for (${target.name}:${target.id})`)
}

export default {
    name: 'moduleExecution',
    handler
}

export interface ModuleExecutionData {
    module: string
    category?: string
    label?: string
    guild: { name: string; id: string }
    target: { name: string; id: string }
}
