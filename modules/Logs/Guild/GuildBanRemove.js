const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').User} user
 */
module.exports = async (self, server, guild, user) => {
    if (server.moderation.logs.types.guild_ban_remove.active) {
        const locale = self.translator.locale(server.locale)

        const log = guild.channels.cache.get(server.moderation.logs.types.guild_ban_remove.channel_id)

        const is_ok = log && guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.modules.logs.common.webhook_create_reason, locale.commands.common.case_log.cases.BAN_REMOVE) })
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
                .setTitle(locale.commands.common.case_log.cases.BAN_REMOVE)
                .setDescription(`${user.tag} (${user.id})`)
                .setTimestamp()
                .setColor(0xE19517)

            await webhook.send('', {
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Guild Ban Remove', guild: { id: guild.id, name: guild.name }, target: { id: user.id, name: user.tag } })
        
            return true
        }
    }

    return false
}