const { MessageEmbed } = require('discord.js')

/**
* @param {import('../../../internals/Lacuna')} self
* @param {import('../../../internals/Typings').ServerDocument} server
* @param {import('discord.js').GuildChannel} channel
*/
module.exports = async (self, server, channel) => {
    if (server.moderation.logs.types.channel_delete.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = channel.guild.channels.cache.get(server.moderation.logs.types.channel_delete.channel_id)

        const is_ok = log && channel.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(channel.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await channel.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.channel_delete.title) })
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
        
            const embed = new MessageEmbed()
                .setTitle(locale.logs.channel_delete.title)
                .setDescription(`${channel.name} (${channel.id})`)
                .addField(locale.logs.channel_create.type, locale.logs.channel_create.types[channel.type] || locale.logs.channel_create.types.unknown, true)
                .addField(locale.logs.channel_create.types.category, channel.parent ? channel.parent.name : '\u200B', true)
                .setTimestamp()
                .setColor(0xF04747)

            await webhook.send('', {
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Channel Delete', guild: { id: channel.guild.id, name: channel.guild.name }, target: { id: channel.id, name: channel.name } })
        
            return true
        }
    }

    return false
}