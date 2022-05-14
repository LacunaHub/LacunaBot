import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, id: number, unavailable_guilds: Set<string>) => {
    await self.logger.info(`(Shard Ready): ${self.user.username}#${id} started`)
    await self.logger.telegram.info(`\`Shard Ready:\` ${self.user.username}#${id} started for`)

    if (id == 0)
        await self.qdb.set(
            'commands',
            self.commands
                .filter(c => !c.private)
                .map(c => {
                    const { name, pretty_name, description, options, group, premium_only, is_prefix_command, is_slash_command, is_user_command, is_message_command, permissions } =
                        c

                    return { name, pretty_name, description, options, group, premium_only, is_prefix_command, is_slash_command, is_user_command, is_message_command, permissions }
                })
        )

    return true
}

export default {
    name: 'shardReady',
    handler,
    once: true,
    initial: true
}
