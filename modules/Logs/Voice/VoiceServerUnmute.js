const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').VoiceState} state
 */
module.exports = async (self, server, state) => {
    if (server.moderation.logs.types.voice_server_unmute.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_server_unmute.channel_id)

        const is_ok = log && log.permissionsFor(state.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) : null

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.update({ _id: state.guild.id }, {
                        $pull: {
                            'moderation.logs.webhooks': {
                                channel_id: log.id
                            }
                        }
                    })
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_server_unmute.title) })
                } catch (err) { return false }

                await self.db.servers.update({ _id: state.guild.id }, {
                    $push: {
                        'moderation.logs.webhooks': {
                            id: webhook.id,
                            token: webhook.token,
                            channel_id: webhook.channelId
                        }
                    }
                })
            }
        
            const embed = new MessageEmbed()
                .setTitle(locale.logs.voice_server_unmute.title)
                .addField(state.member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${state.member.user.tag}`, true)
                .addField(locale.logs.common.channel, `<#${state.channelId}>`, true)
                .addField('\u200B', '\u200B', true)
                .setFooter(state.member.id)
                .setTimestamp()
                .setColor('#FFA726')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Voice Server Unmute', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
        
            return true
        }
    }

    return false
}