const { MessageEmbed } = require('discord.js')
const { TruncateString } = require('../../../internals/utility/Utils')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Collection<String, import('discord.js').Message>} messages
 */
module.exports = async (self, server, messages) => {
    if (server.moderation.logs.types.message_delete_bulk.active) {
        const message = messages.first()
        const locale = self.translator.locale(server.locale).modules

        const log = message.guild.channels.cache.get(server.moderation.logs.types.message_delete_bulk.channel_id)

        const is_ok = log && message.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(message.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await message.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.message_delete_bulk.title) })
                } catch (err) {
                    return false
                }

                await self.db.servers.update({ _id: message.guild.id }, {
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
                .setTitle(locale.logs.message_delete_bulk.title)
                .addField(locale.logs.message_delete_bulk.amount, messages.size, true)
                .addField(locale.logs.common.channel, `<#${message.channel.id}>`, true)
                .setTimestamp()
                .setColor('#EF5350')

            for (const message of messages.first(10)) {
                embed.addField(`${message.author.tag} <t:${Math.round(message.createdTimestamp / 1000)}:R>`, TruncateString(message.content || `\`[${locale.logs.message_delete.attachment}]\``, 100))
            }

            await webhook.send('', {
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Message Delete Bulk', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author ? message.author.id : message.id, name: message.author ? message.author.tag : message.type } })
        
            return true
        }
    }

    return false
}