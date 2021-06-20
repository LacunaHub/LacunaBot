const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').GuildMember} member
 */
module.exports = async (self, server, member) => {
    if (server.moderation.logs.types.guild_member_remove.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_remove.channel_id)

        const is_ok = log && member.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(member.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await member.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.guild_member_remove.title) })
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
                .setTitle(member.user.bot ? locale.logs.guild_member_remove.bot_remove : locale.logs.guild_member_remove.title)
                .setDescription(`${member.user.tag} (${member.id})`)
                .addField(locale.logs.common.members, member.guild.memberCount, true)
                .addField('\u200B', '\u200B', true)
                .setTimestamp()
                .setColor(0xF04747)

            await webhook.send('', {
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Guild Member Remove', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        
            return true
        }
    }

    return false
}