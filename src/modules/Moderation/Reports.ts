import {
    ReportType,
    ServerDocument,
    UserReportDocument,
    UserReportMetadataCategory,
    UserReportMetadataRecommendedAction
} from '@lacunahub/lacuna-database-driver'
import { BaseGuildTextChannel, ButtonInteraction, EmbedBuilder, GuildMember, StringSelectMenuInteraction } from 'discord.js'
import ms from 'ms'
import Lacuna from '../../internals/Lacuna'
import { capitalizeFirstLetter, truncateString } from '../../internals/utility/Utils'
import banAction from '../AutoMod/actions/BanAction'
import kickAction from '../AutoMod/actions/KickAction'
import muteAction from '../AutoMod/actions/MuteAction'
import warnUserAction from '../AutoMod/actions/WarnUserAction'

const QuickActionLocales = {
    BAN: 'CaseLog.CaseTypes.BanAdd',
    KICK: 'CaseLog.CaseTypes.Kick',
    MUTE: 'CaseLog.CaseTypes.MuteAdd',
    WARN: 'CaseLog.CaseTypes.WarnAdd'
}

async function handleButtonClick(self: Lacuna, server: ServerDocument, interaction: ButtonInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)
    const [, action, user_id] = interaction.customId.split('-')

    let member: GuildMember
    const reason = interaction.message.url
    let closeReason = t('Commands.ReportCommand.Texts.ReportClosedBy', { username: `<@${interaction.user.id}> (${interaction.user.tag})` })

    await interaction.deferUpdate()

    try {
        member = await interaction.guild.members.fetch({ user: user_id })
    } catch (err) {}

    if (!member) {
        await interaction.followUp({
            content: `${self.staticEmojis.Cross} | ${t('Commands.ReportCommand.Texts.UnknownUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        await markReportAsClosed(interaction, closeReason)

        return false
    }

    if (action === 'SKIP') {
        if (!interaction.memberPermissions.has(self.PermissionFlags.ModerateMembers)) {
            await interaction.followUp({
                content: `${self.staticEmojis.Cross} | ${t('Commands.CommandExecutionDenied', {
                    username: `**${interaction.member.displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        await markReportAsClosed(interaction, closeReason)

        return true
    }

    if (member.id === interaction.user.id) {
        const message =
            action === 'KICK'
                ? 'Commands.KickCommand.Texts.YouCannotKickYourself'
                : 'Commands.WarnCommand.SubCommands.AddCommand.Texts.YouCannotWarnYourself'

        await interaction.followUp({
            content: `${self.staticEmojis.Cross} | ${t(message, { username: `**${interaction.member.displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && member.roles.highest.position > interaction.member.roles.highest.position) {
        await interaction.followUp({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.UserRoleIsHigherThanYour', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (
        server.moderation.deny_moderate_users_with_mp &&
        member.permissions.has(self.PermissionFlags[action == 'KICK' ? 'KickMembers' : 'ModerateMembers'])
    ) {
        await interaction.followUp({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.UserIsModerator', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        await markReportAsClosed(interaction, closeReason)

        return false
    }

    if (member.roles.cache.some(v => server.moderation.unmoderated_roles.includes(v.id))) {
        await interaction.followUp({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.UserHasUnmoderatedRoles', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        await markReportAsClosed(interaction, closeReason)

        return false
    }

    if (action === 'KICK') {
        if (!interaction.memberPermissions.has(self.PermissionFlags.KickMembers)) {
            await interaction.followUp({
                content: `${self.staticEmojis.Cross} | ${t('Commands.CommandExecutionDenied', {
                    username: `**${interaction.member.displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        if (!member.kickable) {
            await interaction.followUp({
                content: `${self.staticEmojis.Cross} | ${t('Commands.KickCommand.Texts.CannotKickThisUser', {
                    username: `**${interaction.member.displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        await kickAction(self, { guild: interaction.guild, target: member, reason })
    }

    if (action === 'WARN') {
        if (!interaction.memberPermissions.has(self.PermissionFlags.ModerateMembers)) {
            await interaction.followUp({
                content: `${self.staticEmojis.Cross} | ${t('Commands.CommandExecutionDenied', {
                    username: `**${interaction.member.displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        await warnUserAction(self, server, interaction, { target: member, executor: interaction.member, reason })
    }

    closeReason += `: ${t(QuickActionLocales[action])}`
    await markReportAsClosed(interaction, closeReason)

    self.emit('moduleExecution', {
        module: 'Moderation',
        category: 'Reports',
        label: capitalizeFirstLetter(action.toLowerCase()),
        guild: { id: interaction.guild.id, name: interaction.guild.name },
        target: { id: member.id, name: member.user.tag }
    })
}

async function handleOptionSelect(self: Lacuna, server: ServerDocument, interaction: StringSelectMenuInteraction<'cached'>) {
    const t = self.i18n.t.bind(null, server.locale)
    const [, action, user_id] = interaction.customId.split('-')

    let member: GuildMember
    const duration = interaction.values[0]
    const reason = interaction.message.url
    let closeReason = t('Commands.ReportCommand.Texts.ReportClosedBy', { username: `<@${interaction.user.id}> (${interaction.user.tag})` })

    await interaction.deferUpdate()

    try {
        member = await interaction.guild.members.fetch({ user: user_id })
    } catch (err) {}

    if (!member) {
        await interaction.followUp({
            content: `${self.staticEmojis.Cross} | ${t('Commands.ReportCommand.Texts.UnknownUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        await markReportAsClosed(interaction, closeReason)

        return false
    }

    if (member.id === interaction.user.id) {
        const message = action === 'BAN' ? 'Commands.BanCommand.Texts.YouCannotBanYourself' : 'Commands.MuteCommand.Texts.YouCannotMuteYourself'

        await interaction.followUp({
            content: `${self.staticEmojis.Cross} | ${t(message, { username: `**${interaction.member.displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && member.roles.highest.position > interaction.member.roles.highest.position) {
        await interaction.followUp({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.UserRoleIsHigherThanYour', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (
        server.moderation.deny_moderate_users_with_mp &&
        member.permissions.has(self.PermissionFlags[action == 'BAN' ? 'BanMembers' : 'ModerateMembers'])
    ) {
        await interaction.followUp({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.UserIsModerator', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        await markReportAsClosed(interaction, closeReason)

        return false
    }

    if (member.roles.cache.some(v => server.moderation.unmoderated_roles.includes(v.id))) {
        await interaction.followUp({
            content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.UserHasUnmoderatedRoles', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        await markReportAsClosed(interaction, closeReason)

        return false
    }

    if (action === 'BAN') {
        if (!interaction.memberPermissions.has(self.PermissionFlags.BanMembers)) {
            await interaction.followUp({
                content: `${self.staticEmojis.Cross} | ${t('Commands.CommandExecutionDenied', {
                    username: `**${interaction.member.displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        if (!member.bannable) {
            await interaction.followUp({
                content: `${self.staticEmojis.Cross} | ${t('Commands.BanCommand.Texts.CannotBanThisUser', {
                    username: `**${interaction.member.displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        await banAction(self, server, {
            config: { ban_timeout: duration === 'indefinitely' ? null : ms(duration) / 1000 } as any,
            guild: interaction.guild,
            target: member,
            reason
        })
    }

    if (action === 'MUTE') {
        if (!interaction.memberPermissions.has(self.PermissionFlags.ModerateMembers)) {
            await interaction.followUp({
                content: `${self.staticEmojis.Cross} | ${t('Commands.CommandExecutionDenied', {
                    username: `**${interaction.member.displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        if (!member.manageable) {
            await interaction.followUp({
                content: `${self.staticEmojis.Cross} | ${t('Commands.MuteCommand.Texts.CannotMuteThisUser', {
                    username: `**${interaction.member.displayName}**`
                })}`,
                ephemeral: true
            })

            return false
        }

        await muteAction(self, server, {
            config: { mute_timeout: ms(duration) / 1000 } as any,
            guild: interaction.guild,
            target: member,
            reason
        })
    }

    closeReason += `: ${t(QuickActionLocales[action])}`
    await markReportAsClosed(interaction, closeReason)

    self.emit('moduleExecution', {
        module: 'Moderation',
        category: 'Reports',
        label: capitalizeFirstLetter(action.toLowerCase()),
        guild: { id: interaction.guild.id, name: interaction.guild.name },
        target: { id: member.id, name: member.user.tag }
    })
}

async function handleGuildMemberAdd(self: Lacuna, server: ServerDocument, member: GuildMember) {
    if (!server.modules.reports.notify_about_unwanted_users) return false

    const t = self.i18n.t.bind(null, server.locale)
    const userReports = (await self.db.reports.find({
        type: ReportType.User,
        accused_id: member.id,
        checked_at: { $ne: null },
        'metadata.category': { $exists: true, $ne: UserReportMetadataCategory.Meaningless }
    })) as UserReportDocument[]

    if (!userReports.length) return false
    if (!server.modules.reports.active || !server.modules.reports.channel_id) return false

    const channel = member.guild.channels.cache.get(server.modules.reports.channel_id) as BaseGuildTextChannel
    if (!channel) return false

    const last24h = userReports.filter(i => Date.now() - i.created_at < ms('24h')),
        last7d = userReports.filter(i => Date.now() - i.created_at < ms('7d')),
        last10Reports = userReports.slice(Math.max(userReports.length - 10, 0)).sort((a, b) => b.created_at - a.created_at)
    const recommendedActions = [
        ...new Set(
            userReports
                .filter(v => v.metadata.recommended_action !== UserReportMetadataRecommendedAction.Nothing)
                .map(v => v.metadata.recommended_action)
        )
    ]

    const embed = new EmbedBuilder()
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
        .setDescription(t('Commands.ReportCommand.Texts.PotentiallyUnwantedUser'))
        .addFields([
            {
                name: t('Commands.ReportCommand.Texts.ReportCount'),
                value: userReports.length.toString(),
                inline: true
            },
            {
                name: t('Commands.ViolationsCommand.Texts.ViolationsIn24Hours'),
                value: last24h.length.toString(),
                inline: true
            },
            {
                name: t('Commands.ViolationsCommand.Texts.ViolationsIn7Days'),
                value: last7d.length.toString(),
                inline: true
            },
            ...last10Reports.map(v => {
                let reportTypeTitle = `Commands.ReportCommand.Texts.ReportTypes.${UserReportMetadataCategory[v.metadata.category]}.Title`,
                    reportTypeDescription = `Commands.ReportCommand.Texts.ReportTypes.${UserReportMetadataCategory[v.metadata.category]}.Description`

                if (v.metadata.category === UserReportMetadataCategory.Other) {
                    reportTypeTitle = 'Common.Other'
                    reportTypeDescription = null
                }

                return {
                    name: `**${t(reportTypeTitle)}**` + (reportTypeDescription ? `: ${t(reportTypeDescription)}` : ''),
                    value: `${truncateString(v.content, 720)} <t:${Math.round(v.created_at / 1000)}:R>`
                }
            })
        ])
        .setColor('#FFA726')

    if (recommendedActions.length) {
        embed.setFooter({
            text: `${t('Commands.ReportCommand.Texts.RecommendedActions')}: ${recommendedActions
                .map(v => t(`CaseLog.Actions.${UserReportMetadataRecommendedAction[v]}`).toLowerCase())
                .join(', ')}`
        })
    }

    try {
        await channel.send({ embeds: [embed] })
    } catch (err) {
        await self.logger.handleError({
            module: 'Reports',
            action: 'SendNotificationAboutUnwantedUser',
            error: err,
            guild_id: member.guild.id
        })
    }

    return true
}

async function markReportAsClosed(interaction: ButtonInteraction | StringSelectMenuInteraction, reason: string) {
    try {
        const message = await interaction.channel.messages.fetch({ message: interaction.message.id }),
            embed = new EmbedBuilder(message.embeds[0])

        embed.setDescription(reason)

        await message.edit({ embeds: [embed], components: [] })
    } catch (err) {}
}

export default {
    handleButtonClick,
    handleOptionSelect,
    handleGuildMemberAdd
}
