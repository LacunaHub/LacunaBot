const { MessageEmbed } = require('discord.js')

/**
* @param {import('../../../internals/Lacuna')} self
* @param {import('../../../internals/Typings').ServerDocument} server
* @param {import('discord.js').GuildEmoji} emoji
*/
module.exports = async (self, server, emoji) => {
    if (server.moderation.logs.types.emoji_create.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = emoji.guild.channels.cache.get(server.moderation.logs.types.emoji_create.channel_id)

        const is_ok = log && log.permissionsFor(emoji.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) : null

            const audit = emoji.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) ? await emoji.guild.fetchAuditLogs({ limit: 1, type: 'EMOJI_CREATE' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.update({ _id: emoji.guild.id }, {
                        $pull: {
                            'moderation.logs.webhooks': {
                                channel_id: log.id
                            }
                        }
                    })
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.emoji_create.title) })
                } catch (err) { return false }

                await self.db.servers.update({ _id: emoji.guild.id }, {
                    $push: {
                        'moderation.logs.webhooks': {
                            id: webhook.id,
                            token: webhook.token,
                            channel_id: webhook.channelId
                        }
                    }
                })
            }
        
            const embed = new MessageEmbed()
                .setTitle(locale.logs.emoji_create.title)
                .setDescription(self.translator.format(locale.logs.emoji_create.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`))
                .setFooter(emoji.id)
                .setTimestamp()
                .setColor('#2FDF84')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Emoji Create', guild: { id: emoji.guild.id, name: emoji.guild.name }, target: { id: emoji.id, name: emoji.name } })
        
            return true
        }
    }

    return false
}