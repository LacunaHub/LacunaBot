const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').User} user
 */
module.exports = async (self, server, guild, user) => {
    if (server.moderation.logs.types.guild_ban_add.active) {
        const locale = self.translator.locale(server.locale)

        const log = guild.channels.cache.get(server.moderation.logs.types.guild_ban_add.channel_id)

        const is_ok = log && guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            const audit = guild.me.hasPermission('VIEW_AUDIT_LOG') ? await guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_BAN_ADD' }) : null
            const executor = audit?.entries?.first()?.executor
            const reason = audit?.entries?.first()?.reason

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.modules.logs.common.webhook_create_reason, locale.commands.common.case_log.cases.BAN_ADD) })
                } catch (err) {
                    return false
                }

                await self.db.servers.update({ _id: guild.id }, {
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
                .setTitle(locale.commands.common.case_log.cases.BAN_ADD)
                .setDescription(self.translator.format(locale.modules.logs.guild_ban_add.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, `**${user.tag}** (${user.id})`))
                .addField(locale.commands.common.case_log.reason, reason ?? '-')
                .setTimestamp()
                .setColor('#EF5350')

            await webhook.send('', {
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Guild Ban Add', guild: { id: guild.id, name: guild.name }, target: { id: user.id, name: user.tag } })
        
            return true
        }
    }

    return false
}