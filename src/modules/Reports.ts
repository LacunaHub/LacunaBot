import { BaseGuildTextChannel, ButtonInteraction, EmbedBuilder, GuildMember, StringSelectMenuInteraction } from 'discord.js'
import ms from 'ms'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import TemporaryBan from '../internals/structures/TemporaryBan'
import { capitalizeFirstLetter } from '../internals/utility/Utils'
import { caseLog, warnings } from './Moderation'

export async function onPressReportButton(self: Lacuna, server: ServerDocument, interaction: ButtonInteraction) {
    const t = self.i18n.t.bind(null, server.locale)
    const [, action, user_id] = interaction.customId.split('-')

    let member: GuildMember
    const reason = '-'

    await interaction.deferUpdate()

    try {
        member = await interaction.guild.members.fetch({ user: user_id })
    } catch (err) {}

    if (!member) {
        await interaction.followUp({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_invalid', { user: `**${interaction.member['displayName']}**` })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (member.id === interaction.user.id) {
        await interaction.followUp({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_self_quick_action', { user: `**${interaction.member['displayName']}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && member.roles.highest.position > (interaction.member as any).roles.highest.position) {
        await interaction.followUp({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_higher', { user: `**${interaction.member['displayName']}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (
        server.moderation.deny_moderate_users_with_mp &&
        member.permissions.has(self.PermissionFlags[action == 'KICK' ? 'KickMembers' : 'ManageRoles'])
    ) {
        await interaction.followUp({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_moderator', {
                user: `**${interaction.member['displayName']}**`
            })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (member.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.followUp({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_has_unmoderated_roles', {
                user: `**${interaction.member['displayName']}**`
            })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (action === 'KICK') {
        if (!interaction.memberPermissions.has(self.PermissionFlags.KickMembers)) {
            await interaction.followUp({
                content: `${self._emojis.ERROR} | ${t('common.command_denied', { user: `**${interaction.member['displayName']}**` })}`,
                ephemeral: true
            })

            return false
        }

        if (!member.kickable) {
            await interaction.followUp({
                content: `${self._emojis.ERROR} | ${t('commands.kick.text_cant_kick_user', {
                    user: `**${interaction.member['displayName']}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        try {
            await member.kick(reason)
        } catch (err) {
            self.logger.handleError({ module: 'Reports', action: 'KickQuickAction', error: err, guild_id: interaction.guildId })
        }

        await caseLog.createCaseEntry(interaction.guild, { type: 'KICK', target: member.user, executor: interaction.user, reason })
    }

    if (action === 'WARN') {
        if (!interaction.memberPermissions.has(self.PermissionFlags.ManageRoles)) {
            await interaction.followUp({
                content: `${self._emojis.ERROR} | ${t('common.command_denied', { user: `**${interaction.member['displayName']}**` })}`,
                ephemeral: true
            })

            return false
        }

        await warnings.addWarn(self, server, interaction, { target: member, executor: interaction.member as any, reason })
    }

    await removeComponentsFromMessage(interaction)

    self.emit('moduleExecution', {
        module: 'Moderation',
        category: 'Reports',
        label: capitalizeFirstLetter(action.toLowerCase()),
        guild: { id: interaction.guild.id, name: interaction.guild.name },
        target: { id: member.id, name: member.user.tag }
    })
}

export async function onSelectReportOption(self: Lacuna, server: ServerDocument, interaction: StringSelectMenuInteraction) {
    const t = self.i18n.t.bind(null, server.locale)
    const [, action, user_id] = interaction.customId.split('-')

    let member: GuildMember
    const duration = interaction.values[0]
    const reason = '-'

    await interaction.deferUpdate()

    try {
        member = await interaction.guild.members.fetch({ user: user_id })
    } catch (err) {}

    if (!member) {
        await interaction.followUp({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_invalid', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (member.id === interaction.user.id) {
        await interaction.followUp({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_self_quick_action', { user: `**${interaction.member['displayName']}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && member.roles.highest.position > (interaction.member as any).roles.highest.position) {
        await interaction.followUp({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_higher', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (
        server.moderation.deny_moderate_users_with_mp &&
        member.permissions.has(self.PermissionFlags[action == 'BAN' ? 'BanMembers' : 'ModerateMembers'])
    ) {
        await interaction.followUp({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_moderator', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (member.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.followUp({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_has_unmoderated_roles', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (action === 'BAN') {
        if (!interaction.memberPermissions.has(self.PermissionFlags.BanMembers)) {
            await interaction.followUp({
                content: `${self._emojis.ERROR} | ${t('common.command_denied', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
            })

            return false
        }

        if (!member.bannable) {
            await interaction.followUp({
                content: `${self._emojis.ERROR} | ${t('commands.ban.text_cant_ban_user', {
                    user: `**${(interaction.member as any).displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        if (duration === 'indefinitely') {
            try {
                await interaction.guild.members.ban(member, { reason })
            } catch (err) {
                self.logger.handleError({ module: 'Reports', action: 'BanQuickAction', error: err, guild_id: interaction.guildId })
            }
        } else {
            new TemporaryBan(self, {
                user_id: member.id,
                guild_id: interaction.guild.id,
                expires_timestamp: Date.now() + ms(duration),
                reason,
                initial: true
            })
        }

        await caseLog.createCaseEntry(interaction.guild, { type: 'BAN_ADD', target: member.user, executor: interaction.user, reason })
    }

    if (action === 'MUTE') {
        if (!interaction.memberPermissions.has(self.PermissionFlags.ModerateMembers)) {
            await interaction.followUp({
                content: `${self._emojis.ERROR} | ${t('common.command_denied', { user: `**${(interaction.member as any).displayName}**` })}`,
                ephemeral: true
            })

            return false
        }

        if (!member.manageable) {
            await interaction.followUp({
                content: `${self._emojis.ERROR} | ${t('commands.mute.text_cant_mute_user', {
                    user: `**${(interaction.member as any).displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        try {
            await member.disableCommunicationUntil(Date.now() + ms(duration), reason)
        } catch (err) {
            self.logger.handleError({ module: 'Reports', action: 'MuteQuickAction', error: err, guild_id: interaction.guildId })
        }

        if (server.moderation.mutes.rar) {
            const current_roles = member.roles.cache.filter(r => r.editable && r.id !== interaction.guildId).map(r => r.id)

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

            try {
                await member.roles.set(strict_roles, reason)
            } catch (err) {
                self.logger.handleError({ module: 'Reports', action: 'RemoveAllRoles', error: err, guild_id: interaction.guildId })
            }
        }

        await caseLog.createCaseEntry(interaction.guild, { type: 'MUTE_ADD', target: member.user, executor: interaction.user, reason })
    }

    await removeComponentsFromMessage(interaction)

    self.emit('moduleExecution', {
        module: 'Moderation',
        category: 'Reports',
        label: capitalizeFirstLetter(action.toLowerCase()),
        guild: { id: interaction.guild.id, name: interaction.guild.name },
        target: { id: member.id, name: member.user.tag }
    })
}

export async function checkReportsOnGuildMemberAdd(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (!server.modules.reports.notify_about_unwanted_users) return false

    const t = self.i18n.t.bind(null, server.locale)
    const user = await self.db.users.findOne({ _id: member.id })

    if (!user?.reports?.length) return false

    if (server.modules.reports.active && server.modules.reports.channel_id) {
        const channel = member.guild.channels.cache.get(server.modules.reports.channel_id) as BaseGuildTextChannel

        if (channel) {
            const last24h = user.reports.filter(i => Date.now() - i.created_at < ms('24h')),
                last7d = user.reports.filter(i => Date.now() - i.created_at < ms('7d')),
                last10Reports = user.reports.slice(Math.max(user.reports.length - 10, 0)).sort((a, b) => b.created_at - a.created_at)

            const embed = new EmbedBuilder()
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                .setDescription(t('commands.report.text_potentially_unwanted_user'))
                .addFields([
                    {
                        name: t('commands.report.text_total_reports'),
                        value: user.reports.length.toString(),
                        inline: true
                    },
                    {
                        name: t('commands.violations.text_last_24_hours'),
                        value: last24h.length.toString(),
                        inline: true
                    },
                    {
                        name: t('commands.violations.text_last_7_days'),
                        value: last7d.length.toString(),
                        inline: true
                    },
                    {
                        name: t('commands.report.text_recent_reports'),
                        value: '\u200B'
                    },
                    ...last10Reports.map(i => {
                        return {
                            name: `<t:${Math.round(i.created_at / 1000)}:R>`,
                            value: i.reason
                        }
                    })
                ])
                .setColor('#FFA726')

            try {
                await channel.send({ embeds: [embed] })
            } catch (err) {
                self.logger.handleError({ module: 'Reports', action: 'SendNotificationAboutUnwantedUser', error: err, guild_id: member.guild.id })
            }
        }
    }
}

async function removeComponentsFromMessage(interaction: ButtonInteraction | StringSelectMenuInteraction) {
    try {
        const message = await interaction.channel.messages.fetch({ message: interaction.message.id })
        await message.edit({ components: [] })
    } catch (err) {}
}

export default {
    onPressReportButton,
    onSelectReportOption
}
