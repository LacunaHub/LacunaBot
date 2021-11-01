/**
 * @param {import('../../internals/Lacuna')} self
 * @param {Number} id
 * @param {Set<String>} unavailable_guilds
 */
 const handler = async (self, id, unavailable_guilds) => {
    await self.logger.info(`(Shard Ready): ${self.user.username}#${id} started`)
    await self.logger.telegram.info(`\`Shard Ready:\` ${self.user.username}#${id} started for`)

    if (id == 0) await self.qdb.set('commands', self.commands.filter(c => !c.private).map(
        c => {
            const { name, pretty_name, description, options, group, premium_only, is_prefix_command, is_slash_command, is_user_command, is_message_command, permissions } = c

            return { name, pretty_name, description, options, group, premium_only, is_prefix_command, is_slash_command, is_user_command, is_message_command, permissions }
        }
    ))

    return true
}

module.exports = {
    name: 'shardReady',
    handler,
    once: true,
    initial: true
}