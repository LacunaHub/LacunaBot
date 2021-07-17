const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Role} role
 */
module.exports = async (self, server, role) => {
    if (server.moderation.logs.types.role_create.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = role.guild.channels.cache.get(server.moderation.logs.types.role_create.channel_id)

        const is_ok = log && role.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(role.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await role.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            const audit = role.guild.me.hasPermission('VIEW_AUDIT_LOG') ? await role.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_CREATE' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.role_create.title) })
                } catch (err) {
                    return false
                }

                await self.db.servers.update({ _id: role.guild.id }, {
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
                .setTitle(locale.logs.role_create.title)
                .setDescription(self.translator.format(locale.logs.role_create.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, `<@&${role.id}>`))
                .addField(locale.logs.role_create.color, `\`${role.hexColor}\``, true)
                .addField(locale.logs.common.position, role.rawPosition, true)
                .setFooter(role.id)
                .setTimestamp()
                .setColor('#2FDF84')

            await webhook.send('', {
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Role Create', guild: { id: role.guild.id, name: role.guild.name }, target: { id: role.name, name: role.id } })
        
            return true
        }
    }

    return false
}