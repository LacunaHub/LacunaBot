const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').GuildMember} before
 * @param {import('discord.js').GuildMember} member
 */
module.exports = async (self, server, before, member) => {
    if (server.moderation.logs.types.guild_member_update.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_update.channel_id)

        const is_ok = log && member.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(member.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await member.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.guild_member_update.title) })
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

            if (before.nickname != member.nickname) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.guild_member_update.nickname_update)
                    .setDescription(`${member.user.tag} (${member.id})`)
                    .addField(locale.logs.common.before_changes, before.displayName, true)
                    .addField(locale.logs.common.after_changes, member.displayName, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })

                await self.emit('moduleExecution', { module: 'Logs: Guild Member Update', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
            }
        
            return true
        }
    }

    return false
}