const { MessageEmbed } = require('discord.js')
const numbro = require('numbro')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Guild} before
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (self, server, before, guild) => {
    if (server.moderation.logs.types.guild_update.active) {
        const locale = self.translator.locale(server.locale)

        const log = guild.channels.cache.get(server.moderation.logs.types.guild_update.channel_id)

        const is_ok = log && log.permissionsFor(guild.me).has(self.PERMISSIONS_FLAGS.MANAGE_WEBHOOKS)

        if (is_ok) {
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? (await self.fetchWebhook(logs_webhook.id, logs_webhook.token).catch(() => {})) : null

            const audit = guild.me.permissions.has(self.PERMISSIONS_FLAGS.VIEW_AUDIT_LOG) ? await guild.fetchAuditLogs({ limit: 1, type: 'GUILD_UPDATE' }) : null
            const executor = audit?.entries?.first()?.executor

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
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.modules.logs.common.webhook_create_reason, locale.logs.guild_update.title) })
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

            if (before.name != guild.name) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(self.translator.format(locale.modules.logs.guild_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, locale.modules.logs.guild_update.types.name))
                    .addField(locale.modules.logs.common.before_changes, before.name, true)
                    .addField(locale.modules.logs.common.after_changes, guild.name, true)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.afkChannelId != guild.afkChannelId) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(self.translator.format(locale.modules.logs.guild_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, locale.modules.logs.guild_update.types.afk_channel))
                    .addField(locale.modules.logs.common.before_changes, before.afkChannel?.name ?? '-', true)
                    .addField(locale.modules.logs.common.after_changes, guild.afkChannel?.name ?? '-', true)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.afkTimeout != guild.afkTimeout) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(self.translator.format(locale.modules.logs.guild_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, locale.modules.logs.guild_update.types.afk_timeout))
                    .addField(locale.modules.logs.common.before_changes, before.afkTimeout ? numbro(before.afkTimeout).format({ output: 'time' }) : '-', true)
                    .addField(locale.modules.logs.common.after_changes, guild.afkTimeout ? numbro(guild.afkTimeout).format({ output: 'time' }) : '-', true)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.verificationLevel != guild.verificationLevel) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(self.translator.format(locale.modules.logs.guild_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, locale.modules.logs.guild_update.types.verification_level))
                    .addField(locale.modules.logs.common.before_changes, locale.commands.server.texts.verification_levels[before.verificationLevel], true)
                    .addField(locale.modules.logs.common.after_changes, locale.commands.server.texts.verification_levels[guild.verificationLevel], true)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.description != guild.description) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(self.translator.format(locale.modules.logs.guild_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, locale.modules.logs.guild_update.types.description))
                    .addField(locale.modules.logs.common.before_changes, before.description ?? '-', true)
                    .addField(locale.modules.logs.common.after_changes, guild.description ?? '-', true)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.systemChannelId != guild.systemChannelId) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(self.translator.format(locale.modules.logs.guild_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, locale.modules.logs.guild_update.types.system_channel))
                    .addField(locale.modules.logs.common.before_changes, before.systemChannel ? `#${before.systemChannel.name}` : '-', true)
                    .addField(locale.modules.logs.common.after_changes, guild.systemChannel ? `#${guild.systemChannel.name}` : '-', true)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.rulesChannelId != guild.rulesChannelId) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(self.translator.format(locale.modules.logs.guild_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, locale.modules.logs.guild_update.types.rules_channel))
                    .addField(locale.modules.logs.common.before_changes, before.rulesChannel ? `#${before.rulesChannel.name}` : '-', true)
                    .addField(locale.modules.logs.common.after_changes, guild.rulesChannel ? `#${guild.rulesChannel.name}` : '-', true)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.publicUpdatesChannelId != guild.publicUpdatesChannelId) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(self.translator.format(locale.modules.logs.guild_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, locale.modules.logs.guild_update.types.public_updates_channel))
                    .addField(locale.modules.logs.common.before_changes, before.publicUpdatesChannel ? `#${before.publicUpdatesChannel.name}` : '-', true)
                    .addField(locale.modules.logs.common.after_changes, guild.publicUpdatesChannel ? `#${guild.publicUpdatesChannel.name}` : '-', true)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send({
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            await self.emit('moduleExecution', { module: 'Logs: Guild Update', guild: { id: guild.id, name: guild.name }, target: { id: guild.id, name: guild.name } })
        
            return true
        }
    }

    return false
}