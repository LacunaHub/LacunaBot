const { MessageEmbed } = require('discord.js')
const numbro = require('numbro')

/**
* @param {import('../../../internals/Lacuna')} self
* @param {import('../../../internals/Typings').ServerDocument} server
* @param {import('discord.js').ThreadChannel} before
* @param {import('discord.js').ThreadChannel} thread
*/
module.exports = async (self, server, before, thread) => {
    if (server.moderation.logs.types.thread_update.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = thread.guild.channels.cache.get(server.moderation.logs.types.thread_update.channel_id)

        const is_ok = log && log.permissionsFor(thread.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) : null

            const audit = thread.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) ? await thread.guild.fetchAuditLogs({ limit: 1, type: 'THREAD_UPDATE' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.update({ _id: thread.guild.id }, {
                        $pull: {
                            'moderation.logs.webhooks': {
                                channel_id: log.id
                            }
                        }
                    })
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.thread_update.title) })
                } catch (err) { return false }

                await self.db.servers.update({ _id: thread.guild.id }, {
                    $push: {
                        'moderation.logs.webhooks': {
                            id: webhook.id,
                            token: webhook.token,
                            channel_id: webhook.channelId
                        }
                    }
                })
            }

            if (before.name != thread.name) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.thread_update.title)
                    .setDescription(self.translator.format(locale.logs.thread_update.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, self.translator.format(locale.logs.thread_update.types.name, `<#${thread.id}>`)))
                    .addField(locale.logs.common.before_changes, before.name, true)
                    .addField(locale.logs.common.after_changes, thread.name, true)
                    .setFooter(thread.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.autoArchiveDuration != thread.autoArchiveDuration) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.thread_update.title)
                    .setDescription(self.translator.format(locale.logs.thread_update.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, self.translator.format(locale.logs.thread_update.types.auto_archive, `<#${thread.id}>`)))
                    .addField(locale.logs.common.before_changes, numbro(before.autoArchiveDuration * 60).format({ output: 'time' }), true)
                    .addField(locale.logs.common.after_changes, numbro(thread.autoArchiveDuration * 60).format({ output: 'time' }), true)
                    .setFooter(thread.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    username: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            await self.emit('moduleExecution', { module: 'Logs: Thread Update', guild: { id: thread.guild.id, name: thread.guild.name }, target: { id: thread.id, name: thread.name } })
        
            return true
        }
    }

    return false
}