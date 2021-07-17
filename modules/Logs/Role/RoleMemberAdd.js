const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').Collection<string, import('discord.js').Role>} roles
 */
module.exports = async (self, server, member, roles) => {
    if (server.moderation.logs.types.role_member_add.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = member.guild.channels.cache.get(server.moderation.logs.types.role_member_add.channel_id)

        const is_ok = log && member.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(member.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await member.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            const audit = member.guild.me.hasPermission('VIEW_AUDIT_LOG') ? await member.guild.fetchAuditLogs({ limit: 1, type: 'MEMBER_ROLE_UPDATE' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.role_member_add.title) })
                } catch (err) {
                    return false
                }

                await self.db.servers.update({ _id: member.guild.id }, {
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
                .setTitle(locale.logs.role_member_add.title)
                .setDescription(self.translator.format(locale.logs.role_member_add.template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, `**${member.user.tag}**`))
                .addField(locale.logs.common.roles, roles.map(role => `<@&${role.id}>`).join(', '), true)
                .setFooter(member.id)
                .setTimestamp()
                .setColor('#2FDF84')

            await webhook.send('', {
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Role Member Add', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        
            return true
        }
    }

    return false
}