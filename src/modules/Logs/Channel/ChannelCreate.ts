import { AuditLogEvent, BaseGuildTextChannel, EmbedBuilder, GuildChannel } from 'discord.js'
import { fetchLogWebhook } from '..'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async function (self: Lacuna, server: ServerDocument, channel: GuildChannel): Promise<boolean> {
    if (server.moderation.logs.types.channel_create.active) {
        const t = self.i18n.t.bind(null, server.locale)

        const logChannel = channel.guild.channels.cache.get(server.moderation.logs.types.channel_create.channel_id) as BaseGuildTextChannel
        const isOk = logChannel && logChannel.permissionsFor(channel.guild.members.me).has(self.PermissionFlags.ManageWebhooks)

        if (isOk) {
            const webhook = await fetchLogWebhook(self, logChannel, server.moderation.logs.webhooks)

            if (!webhook) return false

            const audit = channel.guild.members.me.permissions.has(self.PermissionFlags.ViewAuditLog)
                ? await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate })
                : null
            const executor = audit?.entries?.first()?.executor

            const embed = new EmbedBuilder()
                .setTitle(t('logs.channel_create_title'))
                .setDescription(
                    t('logs.channel_create_template', { user: `**${executor?.tag ?? t('logs.unknown_initiator')}**`, channel: `<#${channel.id}>` })
                )
                .addFields([
                    { name: t('logs.channel_category'), value: channel?.parent?.name ?? '-', inline: true },
                    { name: t('logs.channel_position'), value: channel.rawPosition.toString(), inline: true }
                ])
                .setFooter({ text: channel.id })
                .setTimestamp()
                .setColor('#2FDF84')

            try {
                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            } catch (err) {
                await self.logger.handleError({ module: 'LogsChannelCreate', action: 'SendMessageViaWebhook', error: err, guild_id: channel.guildId })

                return false
            }

            self.emit('moduleExecution', {
                module: 'Logs',
                category: 'ChannelCreate',
                guild: { id: channel.guild.id, name: channel.guild.name },
                target: { id: channel.id, name: channel.name }
            })

            return true
        }
    }

    return false
}
