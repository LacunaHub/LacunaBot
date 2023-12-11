import { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog, warnings } from '../../../modules/Moderation'

export async function addSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember('user') as GuildMember
    const reason = interaction.options?.getString('reason') ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.WarnCommand.SubCommands.AddCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id == interaction.user.id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.WarnCommand.SubCommands.AddCommand.Texts.YouCannotWarnYourself', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && mention.roles.highest.position > interaction.member.roles.highest.position) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.BanCommand.Texts.UserRoleIsHigherThanYour', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PermissionFlags.ManageRoles)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.BanCommand.Texts.UserIsModerator', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.BanCommand.Texts.UserHasUnmoderatedRoles', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })
    await warnings.addWarn(self, server, interaction, { target: mention, executor: interaction.member, reason: reason })

    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('Commands.WarnCommand.SubCommands.AddCommand.Texts.UserHasBeenWarned', {
            username: `**${interaction.member.displayName}**`,
            target: `**${mention.user.tag}**`
        })}`
    })

    return true
}

export async function removeSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getUser('user')
    const warn_id = interaction.options?.getString('warning-number') as string | number
    const reason = interaction.options?.getString('reason') ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.WarnCommand.SubCommands.RemoveCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!warn_id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.WarnCommand.SubCommands.RemoveCommand.Texts.NoWarnId', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id === mention.id)

    if (!violator || !violator.violations.length) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('Commands.WarnCommand.SubCommands.RemoveCommand.Texts.ThisUserHasNoViolations', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    if (warn_id === 'all') {
        await self.db.servers.updateOne(
            { _id: interaction.guild.id },
            {
                $pull: {
                    'moderation.warnings.violators': {
                        user_id: mention.id
                    }
                }
            }
        )

        await interaction.editReply({
            content: `${self._emojis.OK} | ${t('Commands.WarnCommand.SubCommands.RemoveCommand.Texts.AllUserWarnsHaveBeenRemoved', {
                username: `**${interaction.member.displayName}**`
            })}`
        })
    } else {
        const violation = violator.violations.find((v, i) => v.id == warn_id || i + 1 == warn_id)

        if (!violation) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('Commands.WarnCommand.SubCommands.RemoveCommand.Texts.InvalidWarnId', {
                    username: `**${interaction.member.displayName}**`
                })}`
            })

            return false
        }

        await self.db.servers.updateOne(
            { _id: interaction.guild.id, 'moderation.warnings.violators.user_id': mention.id },
            {
                $pull: {
                    'moderation.warnings.violators.$.violations': {
                        id: violation.id
                    }
                }
            }
        )

        await interaction.editReply({
            content: `${self._emojis.OK} | ${t('Commands.WarnCommand.SubCommands.RemoveCommand.Texts.UserWarnHasBeenRemoved', {
                username: `**${interaction.member.displayName}**`
            })}`
        })
    }

    await caseLog.createCaseEntry(interaction.guild, { type: 'WARN_REMOVE', target: mention, executor: interaction.user, reason })

    return true
}

export default { addSlash, removeSlash }
