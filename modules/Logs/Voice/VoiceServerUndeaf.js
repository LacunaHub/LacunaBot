const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').VoiceState} state
 */
module.exports = async (self, server, state) => {
    if (server.moderation.logs.types.voice_server_undeaf.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = state.guild.channels.cache.get(server.moderation.logs.types.voice_server_undeaf.channel_id)

        const is_ok = log && state.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(state.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await state.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.voice_server_undeaf.title) })
                } catch (err) {
                    return false
                }

                await self.db.servers.update({ _id: state.guild.id }, {
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
                .setTitle(locale.logs.voice_server_undeaf.title)
                .addField(state.member.user.bot ? locale.logs.common.bot : locale.logs.common.user, `${state.member.user.tag}`, true)
                .addField(locale.logs.common.channel, `<#${state.channelID}>`, true)
                .addField('\u200B', '\u200B', true)
                .setFooter(state.member.id)
                .setTimestamp()
                .setColor('#FFA726')

            await webhook.send('', {
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Voice Server Undeaf', guild: { id: state.guild.id, name: state.guild.name }, target: { id: state.member.id, name: state.member.user.tag } })
        
            return true
        }
    }

    return false
}