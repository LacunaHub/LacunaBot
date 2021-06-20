const { MessageEmbed } = require('discord.js')
const { TruncateString } = require('../../../internals/utility/Utils')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    if (server.moderation.logs.types.message_delete.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = message.guild.channels.cache.get(server.moderation.logs.types.message_delete.channel_id)

        const is_ok = log && message.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(message.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const content = TruncateString(message.content || '', 800)

            const webhooks = await message.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.message_delete.title) })
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

            const attachment = message.attachments.first()
        
            const embed = new MessageEmbed()
                .setTitle(locale.logs.message_delete.title)
                .addField(locale.logs.common.sender, `${message.author.tag}\n(${message.author.id})`, true)
                .addField(locale.logs.common.channel, `<#${message.channel.id}>`, true)
                .addField(locale.logs.message_delete.content, content || `\`[${locale.logs.message_delete.attachment}]\``)
                .setFooter(message.id)
                .setTimestamp()
                .setColor(0xF04747)

            if (attachment && attachment.height) embed.setImage(attachment.proxyURL)

            await webhook.send('', {
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Message Delete', guild: { id: message.guild.id, name: message.guild.name }, target: { id: message.author.id, name: message.author.tag } })
        
            return true
        }
    }

    return false
}