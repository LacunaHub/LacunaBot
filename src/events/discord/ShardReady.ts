import { ApplicationCommandOptionType, ApplicationCommandType, Events, PermissionsBitField } from 'discord.js'
import Lacuna from '../../internals/Lacuna'
import RoleConnectionMetadata from '../../internals/utility/RoleConnectionMetadata'
import { snakeToPascalCase } from '../../internals/utility/Utils'

const { version } = require('../../../package.json')

const handler = async (self: Lacuna, id: number, unavailableGuilds: Set<string>) => {
    if (self.cluster.id === 0) {
        const storedVersion = await self.db.qdb.get('version')

        if (storedVersion !== version) {
            await self.db.qdb.set('version', version)

            const t = self.i18n.t
            const commands = [
                ...self.commands
                    .filter(c => c.is_slash_command)
                    .map(command => {
                        return {
                            name: command.name,
                            description: self.i18n.t('en', command.description),
                            description_localizations: {
                                ru: self.i18n.t('ru', command.description),
                                uk: self.i18n.t('uk', command.description)
                            },
                            type: command.type,
                            options:
                                command.options?.map(option => {
                                    if (option.type === ApplicationCommandOptionType.Subcommand)
                                        return {
                                            ...option,
                                            type: ApplicationCommandOptionType.Subcommand,
                                            description: t('en', option.description),
                                            description_localizations: {
                                                ru: t('ru', option.description),
                                                uk: t('uk', option.description)
                                            },
                                            options:
                                                option.options?.map(opt => {
                                                    return {
                                                        ...opt,
                                                        type: opt.type,
                                                        name: t('en', opt.name),
                                                        name_localizations: {
                                                            ru: t('ru', opt.name),
                                                            uk: t('uk', opt.name)
                                                        },
                                                        description: t('en', opt.description),
                                                        description_localizations: {
                                                            ru: t('ru', opt.description),
                                                            uk: t('uk', opt.description)
                                                        },
                                                        choices:
                                                            opt.choices?.map(choice => {
                                                                return {
                                                                    ...choice,
                                                                    name: t('en', choice.name),
                                                                    name_localizations: {
                                                                        ru: t('ru', choice.name),
                                                                        uk: t('uk', choice.name)
                                                                    }
                                                                }
                                                            }) ?? null
                                                    }
                                                }) ?? []
                                        }

                                    return {
                                        ...option,
                                        type: option.type,
                                        name: t('en', option.name),
                                        name_localizations: {
                                            ru: t('ru', option.name),
                                            uk: t('uk', option.name)
                                        },
                                        description: t('en', option.description),
                                        description_localizations: {
                                            ru: t('ru', option.description),
                                            uk: t('uk', option.description)
                                        },
                                        choices:
                                            option.choices?.map(choice => {
                                                return {
                                                    ...choice,
                                                    name: t('en', choice.name),
                                                    name_localizations: {
                                                        ru: t('ru', choice.name),
                                                        uk: t('uk', choice.name)
                                                    }
                                                }
                                            }) ?? null
                                    }
                                }) ?? [],
                            default_member_permissions: command.permissions.user.length
                                ? new PermissionsBitField(command.permissions.user.map(i => snakeToPascalCase(i)) as any)
                                : undefined,
                            dm_permission: false
                        }
                    }),
                ...self.commands
                    .filter(i => i.is_user_command || i.is_message_command)
                    .map(command => {
                        return {
                            name: t('en', command.pretty_name),
                            name_localizations: {
                                ru: t('ru', command.pretty_name),
                                uk: t('uk', command.pretty_name)
                            },
                            type: command.is_user_command ? ApplicationCommandType.User : ApplicationCommandType.Message,
                            default_member_permissions: command.permissions.user.length
                                ? new PermissionsBitField(command.permissions.user.map(i => snakeToPascalCase(i)) as any)
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
                        name: t('en', i.name),
                        nameLocalizations: {
                            ru: t('ru', i.name),
                            uk: t('uk', i.name)
                        },
                        description: t('en', i.description),
                        descriptionLocalizations: {
                            ru: t('ru', i.description),
                            uk: t('uk', i.description)
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
