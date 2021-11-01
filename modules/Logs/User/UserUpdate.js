const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').User} before
 * @param {import('discord.js').User} user
 */
module.exports = async (self, server, guild, before, user) => {
    if (server.moderation.logs.types.user_update.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = guild.channels.cache.get(server.moderation.logs.types.user_update.channel_id)

        const is_ok = log && log.permissionsFor(guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) : null

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.update({ _id: guild.id }, {
                        $pull: {
                            'moderation.logs.webhooks': {
                                channel_id: log.id
                            }
                        }
                    })
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.user_update.title) })
                } catch (err) { return false }

                await self.db.servers.update({ _id: guild.id }, {
                    $push: {
                        'moderation.logs.webhooks': {
                            id: webhook.id,
                            token: webhook.token,
                            channel_id: webhook.channelId
                        }
                    }
                })
            }

            if (before.username != user.username) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.user_update.title)
                    .setDescription(self.translator.format(locale.logs.user_update.types.username, `**${user.tag}**`))
                    .addField(locale.logs.common.before_changes, before.username, true)
                    .addField(locale.logs.common.after_changes, user.username, true)
                    .setFooter(user.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.discriminator != user.discriminator) {
                const embed = new MessageEmbed()
                    .setTitle(locale.logs.user_update.title)
                    .setDescription(self.translator.format(locale.logs.user_update.types.discriminator, `**${user.tag}**`))
                    .addField(locale.logs.common.before_changes, before.discriminator, true)
                    .addField(locale.logs.common.after_changes, user.discriminator, true)
                    .setFooter(user.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            await self.emit('moduleExecution', { module: 'Logs: User Update', guild: { id: guild.id, name: guild.name }, target: { id: user.username, name: user.id } })
        
            return true
        }
    }

    return false
}