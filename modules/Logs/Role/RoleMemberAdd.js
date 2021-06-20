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
                .addField(member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${member.user.tag}\n(${member.user.id})`, true)
                .addField(locale.logs.common.role, roles.map(role => `<@&${role.id}>`).join(', '), true)
                .setTimestamp()
                .setColor(0x43b581)

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