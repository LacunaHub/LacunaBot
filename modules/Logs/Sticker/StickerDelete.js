const { MessageEmbed } = require('discord.js')

/**
* @param {import('../../../internals/Lacuna')} self
* @param {import('../../../internals/Typings').ServerDocument} server
* @param {import('discord.js').Sticker} sticker
*/
module.exports = async (self, server, sticker) => {
    if (server.moderation.logs.types.sticker_delete.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = sticker.guild.channels.cache.get(server.moderation.logs.types.sticker_delete.channel_id)

        const is_ok = log && log.permissionsFor(sticker.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) : null

            const audit = sticker.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) ? await sticker.guild.fetchAuditLogs({ limit: 1, type: 'STICKER_DELETE' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.update({ _id: sticker.guild.id }, {
                        $pull: {
                            'moderation.logs.webhooks': {
                                channel_id: log.id
                            }
                        }
                    })
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.sticker_delete.title) })
                } catch (err) { return false }

                await self.db.servers.update({ _id: sticker.guild.id }, {
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
                .setTitle(locale.logs.sticker_delete.title)
                .setDescription(self.translator.format(locale.logs.sticker_delete.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, `**${sticker.name}**`))
                .setFooter(sticker.id)
                .setTimestamp()
                .setColor('#EF5350')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                username: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Sticker Delete', guild: { id: sticker.guild.id, name: sticker.guild.name }, target: { id: sticker.id, name: sticker.name } })
        
            return true
        }
    }

    return false
}