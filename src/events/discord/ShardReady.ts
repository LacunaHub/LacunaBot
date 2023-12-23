import { ApplicationCommandOptionType, ApplicationCommandType, Events, PermissionsBitField } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import RoleConnectionMetadata from '../../internals/utility/RoleConnectionMetadata'
import { normalizeCommandOption } from '../../internals/utility/Utils'

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
                ...self.commands
                    .filter(c => c.is_slash_command)
                    .map(command => {
                        return {
                            name: command.name,
                            description: tEn(command.description),
                            description_localizations: {
                                ru: tRu(command.description),
                                uk: tUk(command.description)
                            },
                            type: command.type,
                            options:
                                command.options?.map(option => {
                                    if (option.type === ApplicationCommandOptionType.Subcommand)
                                        return {
                                            ...option,
                                            type: ApplicationCommandOptionType.Subcommand,
                                            description: tEn(option.description),
                                            description_localizations: {
                                                ru: tRu(option.description),
                                                uk: tUk(option.description)
                                            },
                                            options:
                                                option.options?.map(opt => {
                                                    return {
                                                        ...opt,
                                                        type: opt.type,
                                                        name: normalizeCommandOption(tEn(opt.name)),
                                                        name_localizations: {
                                                            ru: normalizeCommandOption(tRu(opt.name)),
                                                            uk: normalizeCommandOption(tUk(opt.name))
                                                        },
                                                        description: tEn(opt.description),
                                                        description_localizations: {
                                                            ru: tRu(opt.description),
                                                            uk: tUk(opt.description)
                                                        },
                                                        choices:
                                                            opt.choices?.map(choice => {
                                                                return {
                                                                    ...choice,
                                                                    name: tEn(choice.name),
                                                                    name_localizations: {
                                                                        ru: tRu(choice.name),
                                                                        uk: tUk(choice.name)
                                                                    }
                                                                }
                                                            }) ?? null
                                                    }
                                                }) ?? []
                                        }

                                    return {
                                        ...option,
                                        type: option.type,
                                        name: normalizeCommandOption(tEn(option.name)),
                                        name_localizations: {
                                            ru: normalizeCommandOption(tRu(option.name)),
                                            uk: normalizeCommandOption(tUk(option.name))
                                        },
                                        description: tEn(option.description),
                                        description_localizations: {
                                            ru: tRu(option.description),
                                            uk: tUk(option.description)
                                        },
                                        choices:
                                            option.choices?.map(choice => {
                                                return {
                                                    ...choice,
                                                    name: tEn(choice.name),
                                                    name_localizations: {
                                                        ru: tRu(choice.name),
                                                        uk: tUk(choice.name)
                                                    }
                                                }
                                            }) ?? null
                                    }
                                }) ?? [],
                            default_member_permissions: command.permissions.user.length
                                ? new PermissionsBitField(command.permissions.user)
                                : undefined,
                            dm_permission: false
                        }
                    }),
                ...self.commands
                    .filter(i => i.is_user_command || i.is_message_command)
                    .map(command => {
                        return {
                            name: tEn(command.pretty_name),
                            name_localizations: {
                                ru: tRu(command.pretty_name),
                                uk: tUk(command.pretty_name)
                            },
                            type: command.is_user_command ? ApplicationCommandType.User : ApplicationCommandType.Message,
                            default_member_permissions: command.permissions.user.length
                                ? new PermissionsBitField(command.permissions.user)
                                : undefined,
                            dm_permission: false
                        }
                    })
            ]

            await self.application.commands.set(commands as any)
            await self.db.qdb.set(
                'commands',
                self.commands
                    .filter(c => !c.private)
                    .map(c => {
                        return {
                            name: c.name,
                            pretty_name: c.pretty_name,
                            description: c.description,
                            options: c.options,
                            group: c.group,
                            premium_only: c.premium_only,
                            is_slash_command: c.is_slash_command,
                            is_user_command: c.is_user_command,
                            is_message_command: c.is_message_command,
                            permissions: c.permissions
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
