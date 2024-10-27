import { Events } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import { Command, CommandBuildJSONType } from '../../internals/structures/Command'
import RoleConnectionMetadata from '../../internals/utility/RoleConnectionMetadata'

const { version } = require('../../../package.json')

const handler = async (self: Lacuna, id: number, unavailableGuilds: Set<string>) => {
    if (self.cluster.id === 0) {
        const storedVersion = await self.db.qdb.get('version')

        if (storedVersion !== version) {
            await self.db.qdb.set('version', version)

            const tEn = self.i18n.t.bind(null, 'en'),
                tRu = self.i18n.t.bind(null, 'ru'),
                tUk = self.i18n.t.bind(null, 'uk')

            const commands = [
                ...self.commands.filter(v => v.isSlashCommand).map(v => Command.buildJSON(CommandBuildJSONType.Slash, v)),
                ...self.commands.filter(v => v.isUserContextCommand).map(v => Command.buildJSON(CommandBuildJSONType.UserContextMenu, v)),
                ...self.commands.filter(v => v.isMessageContextCommand).map(v => Command.buildJSON(CommandBuildJSONType.MessageContextMenu, v))
            ]

            await self.application.commands.set(commands as any)
            await self.db.qdb.set(
                'commands',
                self.commands
                    .filter(v => !v.private)
                    .map(v => {
                        return {
                            name: v.name,
                            pretty_name: v.prettyName,
                            description: v.description,
                            options: v.options,
                            group: v.group,
                            premium: v.premium,
                            is_slash_command: v.isSlashCommand,
                            is_user_command: v.isUserContextCommand,
                            is_message_command: v.isMessageContextCommand,
                            default_member_permissions: v.defaultMemberPermissions,
                            self_permissions: v.selfPermissions
                        }
                    })
            )

            await self.application.editRoleConnectionMetadataRecords(
                RoleConnectionMetadata.map(i => {
                    return {
                        key: i.key,
                        type: i.type,
                        name: tEn(i.name),
                        nameLocalizations: {
                            ru: tRu(i.name),
                            uk: tUk(i.name)
                        },
                        description: tEn(i.description),
                        descriptionLocalizations: {
                            ru: tRu(i.description),
                            uk: tUk(i.description)
                        }
                    }
                })
            )

            self.logger.log('[DiscordShardReady] Commands and role connections have been overwritten due to a version change')
        }

        const emojis = self.loadEmojis(),
            appEmojis = await self.application.emojis.fetch(),
            emojisToCreate = emojis.filter(v => !appEmojis.some(vv => v.name === vv.name))

        for (const emoji of emojisToCreate) await self.application.emojis.create({ name: emoji.name, attachment: emoji.image })
        self.logger.log(`[DiscordShardReady] Created ${emojisToCreate.length} emojis`)
    }

    self.logger.info(`[DiscordShardReady] Shard #${id} of cluster #${self.cluster.id} is ready`)
    await self.logger.telegram.info(`\`[DiscordShardReady]\` Shard #${id} of cluster #${self.cluster.id} is ready`)

    if (unavailableGuilds?.size) {
        self.logger.warn(`[DiscordShardReady] Found unavailable guilds`, ...unavailableGuilds.keys())
    }

    return true
}

export default {
    name: Events.ShardReady,
    handler,
    once: true,
    initial: true
}
