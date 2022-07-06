import { ButtonInteraction, GuildMember, SelectMenuInteraction } from 'discord.js'
import ms from 'ms'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import TemporaryBan from '../internals/structures/TemporaryBan'
import { caseLog, warnings } from './Moderation'

export async function buttonPressed(self: Lacuna, server: ServerDocument, interaction: ButtonInteraction) {
    const [, action, user_id] = interaction.customId.split('-')

    const member = await interaction.guild.members.fetch(user_id).catch(() => {})
    const t = self.i18n.t.bind(null, server.locale)
    const reason = 'Репорты'

    if (!member) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_invalid', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return
    }

    if (member.id == interaction.user.id) {
        await removeComponentsFromMessage(interaction)

        return
    }

    if (server.moderation.respect_hierarchy && member.roles.highest.position > (interaction.member as any).roles.highest.position) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_higher', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && member.permissions.has(self.PERMISSIONS_FLAGS[action == 'KICK' ? 'KICK_MEMBERS' : 'MANAGE_ROLES'])) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_moderator', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (member.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_has_unmoderated_roles', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (action == 'KICK') {
        if (!interaction.memberPermissions.has(self.PERMISSIONS_FLAGS.KICK_MEMBERS)) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${t('common.command_denied', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
            })

            return
        }

        if (!member.kickable) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${t('commands.kick.text_cant_kick_user', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
            })

            return
        }

        await member.kick(reason).catch(() => {})
        await caseLog.createCaseEntry(server, interaction.guild, { type: 'KICK', target: member.user, executor: interaction.user, reason })
    }

    if (action == 'WARN') {
        if (!interaction.memberPermissions.has(self.PERMISSIONS_FLAGS.MANAGE_ROLES)) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${t('common.command_denied', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
            })

            return
        }

        await warnings.addWarn(self, server, interaction, { target: member, executor: interaction.member as any, reason })
    }

    await removeComponentsFromMessage(interaction)
}

export async function optionSelected(self: Lacuna, server: ServerDocument, interaction: SelectMenuInteraction) {
    const [, action, user_id] = interaction.customId.split('-')
    const member = (await interaction.guild.members.fetch(user_id).catch(() => {})) as GuildMember
    const t = self.i18n.t.bind(null, server.locale)
    const duration = interaction.values[0]
    const reason = 'Репорты'

    if (!member) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_invalid', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return
    }

    if (member.id == interaction.user.id) {
        await removeComponentsFromMessage(interaction)

        return
    }

    if (server.moderation.respect_hierarchy && member.roles.highest.position > (interaction.member as any).roles.highest.position) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_higher', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && member.permissions.has(self.PERMISSIONS_FLAGS[action == 'BAN' ? 'BAN_MEMBERS' : 'MODERATE_MEMBERS'])) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_moderator', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (member.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_has_unmoderated_roles', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (action == 'BAN') {
        if (!interaction.memberPermissions.has(self.PERMISSIONS_FLAGS.BAN_MEMBERS)) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${t('common.command_denied', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
            })

            return
        }

        if (!member.bannable) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${t('commands.ban.text_cant_ban_user', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
            })

            return
        }

        if (duration == 'indefinitely') {
            await interaction.guild.members.ban(member, { reason }).catch(() => {})
        } else {
            new TemporaryBan(self, {
                user_id: member.id,
                guild_id: interaction.guild.id,
                expires_timestamp: Date.now() + ms(duration),
                reason,
                initial: true
            })
        }

        await caseLog.createCaseEntry(server, interaction.guild, { type: 'BAN_ADD', target: member.user, executor: interaction.user, reason })
    }

    if (action == 'MUTE') {
        if (!interaction.memberPermissions.has(self.PERMISSIONS_FLAGS.MODERATE_MEMBERS)) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${t('common.command_denied', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
            })

            return
        }

        if (!member.manageable) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${t('commands.mute.text_cant_mute_user', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
            })

            return
        }

        await member.disableCommunicationUntil(Date.now() + ms(duration), reason)

        if (server.moderation.mutes.rar) {
            const current_roles = member.roles.cache.filter(r => r.editable && r.id != interaction.guildId).map(r => r.id)

            await self.db.servers.updateOne(
                { _id: interaction.guildId },
                {
                    $push: {
                        'moderation.mutes.rar_data': {
                            user_id: member.id,
                            roles: current_roles
                        }
                    }
                }
            )

            const strict_roles = [
                ...server.moderation.mutes.rar_strict.filter(r => current_roles.includes(r)),
                ...member.roles.cache.filter(r => !r.editable).map(r => r.id)
            ]

            await member.roles.set(strict_roles, reason).catch(self.logger.error)
        }

        await caseLog.createCaseEntry(server, interaction.guild, { type: 'MUTE_ADD', target: member.user, executor: interaction.user, reason })
    }

    await removeComponentsFromMessage(interaction)
}

async function removeComponentsFromMessage(interaction: ButtonInteraction | SelectMenuInteraction) {
    const message = await interaction.channel.messages.fetch(interaction.message.id)
    await message?.edit({ components: [] })
}

export default {
    buttonPressed,
    optionSelected
}
