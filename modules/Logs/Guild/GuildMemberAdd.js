const { MessageEmbed } = require('discord.js')
const moment = require('moment')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').GuildMember} member
 */
module.exports = async (self, server, member) => {
    if (server.moderation.logs.types.guild_member_add.active) {
        const locale = self.translator.locale(server.locale).modules

        const log = member.guild.channels.cache.get(server.moderation.logs.types.guild_member_add.channel_id)

        const is_ok = log && log.permissionsFor(member.guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) : null

            const audit = member.guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) ? await member.guild.fetchAuditLogs({ limit: 1, type: 'BOT_ADD' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                if (logs_webhook) {
                    await self.db.servers.update({ _id: member.guild.id }, {
                        $pull: {
                            'moderation.logs.webhooks': {
                                channel_id: log.id
                            }
                        }
                    })
                }

                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.logs.common.webhook_create_reason, locale.logs.guild_member_add.title) })
                } catch (err) { return false }

                await self.db.servers.update({ _id: member.guild.id }, {
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
                .setTitle(member.user.bot ? locale.logs.guild_member_add.bot_add : locale.logs.guild_member_add.title)
                .setDescription(member.user.bot ? self.translator.format(locale.logs.guild_member_add.bot_add_template, `**${executor?.tag ?? locale.logs.common.unknown_initiator}**`, `**${member.user.tag}** (${member.id})`) : `${member.user.tag} (${member.id})`)
                .addField(locale.logs.common.members, member.guild.memberCount.toString(), true)
                .addField(locale.logs.common.account_created, `<t:${Math.round(member.user.createdTimestamp / 1000)}:R>`, true)
                .setTimestamp()
                .setColor('#2FDF84')

            await webhook.send({
                embeds: [embed],
                avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                name: server.server.premium.available ? webhook.name : self.user.username
            })

            await self.emit('moduleExecution', { module: 'Logs: Guild Member Add', guild: { id: member.guild.id, name: member.guild.name }, target: { id: member.id, name: member.user.tag } })
        
            return true
        }
    }

    return false
}