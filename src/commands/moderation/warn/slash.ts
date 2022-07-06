import { CommandInteraction, GuildMember } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog, warnings } from '../../../modules/Moderation'

export async function addSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember(t('commands.warn.add.options.user.name')) as GuildMember
    const reason = interaction.options?.getString(t('commands.warn.add.options.reason.name')) ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.warn.add.text_user_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id == interaction.user.id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.warn.add.text_self_action', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && mention.roles.highest.position > (interaction.member as any).roles.highest.position) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_higher', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PERMISSIONS_FLAGS.MANAGE_ROLES)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_moderator', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_has_unmoderated_roles', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await warnings.addWarn(self, server, interaction, { target: mention, executor: interaction.member as GuildMember, reason: reason })

    await interaction.reply({
        content: `${self._emojis.OK} | ${t('commands.warn.add.text_user_warned', {
            user: `**${(interaction.member as any).displayName}**`,
            target: `**${mention.user.tag}**`
        })}`,
        ephemeral: true
    })

    return true
}

export async function removeSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember(t('commands.warn.remove.options.user.name')) as GuildMember
    const warn_id = interaction.options?.getString(t('commands.warn.remove.options.warn_id.name')) as string | number
    const reason = interaction.options?.getString(t('commands.warn.remove.options.reason.name')) ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.warn.remove.text_user_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!warn_id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.warn.remove.text_no_warn_id', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == mention.id)

    if (!violator || !violator.violations.length) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.warn.remove.text_no_violator_or_violations', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

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

        await interaction.reply({
            content: `${self._emojis.OK} | ${t('commands.warn.remove.text_warns_removed_all', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })
    } else {
        const violation = violator.violations.find((v, i) => v.id == warn_id || i + 1 == warn_id)

        if (!violation) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${t('commands.warn.remove.text_invalid_warn_id', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
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

        await interaction.reply({
            content: `${self._emojis.OK} | ${t('commands.warn.remove.text_warn_removed', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })
    }

    await caseLog.createCaseEntry(server, interaction.guild, { type: 'WARN_REMOVE', target: mention.user, executor: interaction.user, reason })

    return true
}

export default { addSlash, removeSlash }
