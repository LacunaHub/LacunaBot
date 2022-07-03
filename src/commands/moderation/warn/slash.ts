import { CommandInteraction, GuildMember } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog, warnings } from '../../../modules/Moderation'

export async function addSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.add.texts.user_not_found, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id == interaction.user.id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.self_action, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && mention.roles.highest.position > (interaction.member as any).roles.highest.position) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_is_higher, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PERMISSIONS_FLAGS.MANAGE_ROLES)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_is_moderator, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    if (mention.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.user_has_unmoderated_roles, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    await warnings.addWarn(self, server, interaction, { target: mention, executor: interaction.member as GuildMember, reason: reason })

    await interaction.reply({
        content: `${self._emojis.OK} | ${self.translator.format(
            locale.warn.add.texts.user_warned,
            `**${(interaction.member as any).displayName}**`,
            `**${mention.user.tag}**`
        )}`,
        ephemeral: true
    })

    return true
}

export async function removeSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const warn_id = interaction.options?.getString('номер-предупреждения') as string | number
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.add.texts.user_not_found, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    if (!warn_id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_warn_id, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == mention.id)

    if (!violator || !violator.violations.length) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(
                locale.warn.remove.texts.no_violator_or_violations,
                `**${(interaction.member as any).displayName}**`
            )}`,
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
            content: `${self._emojis.OK} | ${self.translator.format(locale.warn.remove.texts.warns_removed_all, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })
    } else {
        const violation = violator.violations.find((v, i) => v.id == warn_id || i + 1 == warn_id)

        if (!violation) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.invalid_warn_id, `**${(interaction.member as any).displayName}**`)}`,
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
            content: `${self._emojis.OK} | ${self.translator.format(locale.warn.remove.texts.warn_removed, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })
    }

    await caseLog.createCaseEntry(server, interaction.guild, { type: 'WARN_REMOVE', target: mention.user, executor: interaction.user, reason })

    return true
}

export default { addSlash, removeSlash }
