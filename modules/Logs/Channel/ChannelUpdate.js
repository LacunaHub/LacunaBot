const { MessageEmbed } = require('discord.js')

/**
* @param {import('../../../internals/Lacuna')} self
* @param {import('../../../internals/Typings').ServerDocument} server
* @param {import('discord.js').GuildChannel} before
* @param {import('discord.js').GuildChannel} channel
*/
module.exports = async (self, server, before, channel) => {
    if (server.moderation.logs.types.channel_update.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = channel.guild.channels.cache.get(server.moderation.logs.types.channel_update.channel_id)

        const is_ok = log && channel.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(channel.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await channel.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.channel_update.title) })
                } catch (err) {
                    return false
                }

                await self.db.servers.update({ _id: channel.guild.id }, {
                    $push: {
                        'moderation.logs.webhooks': {
                            id: webhook.id,
                            token: webhook.token,
                            channel_id: webhook.channelID
                        }
                    }
                })
            }

            if (before.name != channel.name) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(`${channel.name} (${channel.id})`)
                    .addField('\u200B', self.translator.format(locale.logs.channel_update.name_update, `**${before.name}**`, `**${channel.name}**`), true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.topic != channel.topic) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(`${channel.name} (${channel.id})`)
                    .addField('\u200B', self.translator.format(locale.logs.channel_update.topic_update, `**${before.topic || '-'}**`, `**${channel.topic || '-'}**`), true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.rateLimitPerUser != channel.rateLimitPerUser) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(`${channel.name} (${channel.id})`)
                    .addField('\u200B', self.translator.format(locale.logs.channel_update.rate_limit_update, `**${before.rateLimitPerUser || 0}**`, `**${channel.rateLimitPerUser || 0}**`), true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.parentID != channel.parentID) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(`${channel.name} (${channel.id})`)
                    .addField('\u200B', self.translator.format(locale.logs.channel_update.parent_update, before.parent ? `**${before.parent.name}**` : '**-**', channel.parent ? `**${channel.parent.name}**` : '**-**'), true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.bitrate != channel.bitrate) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(`${channel.name} (${channel.id})`)
                    .addField('\u200B', self.translator.format(locale.logs.channel_update.bitrate_update, `**${before.bitrate / 1000}**kbps`, `**${channel.bitrate / 1000}**kbps`), true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.userLimit != channel.userLimit) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.channel_update.title)
                    .setDescription(`${channel.name} (${channel.id})`)
                    .addField('\u200B', self.translator.format(locale.logs.channel_update.user_limit_update, `**${before.userLimit}**`, `**${channel.userLimit}**`), true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            await self.emit('moduleExecution', { module: 'Logs: Channel Update', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
        
            return true
        }
    }

    return false
}