const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Invite} invite
 */
module.exports = async (self, server, invite) => {
    if (server.moderation.logs.types.invite_create.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = invite.guild.channels.cache.get(server.moderation.logs.types.invite_create.channel_id)

        const is_ok = log && invite.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(invite.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await invite.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.invite_create.title) })
                } catch (err) {
                    return false
                }

                await self.db.servers.update({ _id: invite.guild.id }, {
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
                .setTitle(locale.logs.invite_create.title)
                .addField(locale.logs.common.invite_code, `[${invite.code}](${invite.url})`, true)
                .addField(locale.logs.common.channel, `<#${invite.channel.id}>`, true)
                .addField(locale.logs.common.invite_inviter, invite.inviter ? `${invite.inviter.tag}` : '\u200B', true)
                .setTimestamp()
                .setColor('#2FDF84')

            await webhook.send('', {
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Invite Create', guild: { id: invite.guild.id, name: invite.guild.name }, target: { id: invite.channel.name, name: invite.code } })
        
            return true
        }
    }

    return false
}