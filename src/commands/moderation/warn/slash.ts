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
            content: `${self._emojis.ERROR} | ${t('commands.warn.add.text_user_not_found', {
                user: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id == interaction.user.id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.warn.add.text_self_action', { user: `**${interaction.member.displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && mention.roles.highest.position > interaction.member.roles.highest.position) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_higher', { user: `**${interaction.member.displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PermissionFlags.ManageRoles)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_moderator', {
                user: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_has_unmoderated_roles', {
                user: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })
    await warnings.addWarn(self, server, interaction, { target: mention, executor: interaction.member, reason: reason })

    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('commands.warn.add.text_user_warned', {
            user: `**${interaction.member.displayName}**`,
            target: `**${mention.user.tag}**`
        })}`
    })

    return true
}

export async function removeSlash(self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember('user') as GuildMember
    const warn_id = interaction.options?.getString('warning-number') as string | number
    const reason = interaction.options?.getString('reason') ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.warn.remove.text_user_not_found', {
                user: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!warn_id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.warn.remove.text_no_warn_id', {
                user: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == mention.id)

    if (!violator || !violator.violations.length) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.warn.remove.text_no_violator_or_violations', {
                user: `**${interaction.member.displayName}**`
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
            content: `${self._emojis.OK} | ${t('commands.warn.remove.text_warns_removed_all', {
                user: `**${interaction.member.displayName}**`
            })}`
        })
    } else {
        const violation = violator.violations.find((v, i) => v.id == warn_id || i + 1 == warn_id)

        if (!violation) {
            await interaction.editReply({
                content: `${self._emojis.ERROR} | ${t('commands.warn.remove.text_invalid_warn_id', {
                    user: `**${interaction.member.displayName}**`
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
            content: `${self._emojis.OK} | ${t('commands.warn.remove.text_warn_removed', { user: `**${interaction.member.displayName}**` })}`
        })
    }

    await caseLog.createCaseEntry(interaction.guild, { type: 'WARN_REMOVE', target: mention.user, executor: interaction.user, reason })

    return true
}

export default { addSlash, removeSlash }
