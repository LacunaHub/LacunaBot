const { MessageEmbed } = require('discord.js')

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

        const is_ok = log && guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.modules.logs.common.webhook_create_reason, locale.logs.guild_update.title) })
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

            if (before.name != guild.name) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(locale.modules.logs.guild_update.types.name)
                    .addField(locale.modules.logs.common.before_changes, before.name, true)
                    .addField(locale.modules.logs.common.after_changes, guild.name, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.region != guild.region) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(locale.commands.server.texts.region)
                    .addField(locale.modules.logs.common.before_changes, locale.commands.server.texts.regions[before.region], true)
                    .addField(locale.modules.logs.common.after_changes, locale.commands.server.texts.regions[guild.region], true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.afkChannelID != guild.afkChannelID) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(locale.commands.server.texts.afk_channel)
                    .addField(locale.modules.logs.common.before_changes, before.afkChannel ? before.afkChannel.name : locale.commands.common.texts.none, true)
                    .addField(locale.modules.logs.common.after_changes, guild.afkChannel ? guild.afkChannel.name : locale.commands.common.texts.none, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.afkTimeout != guild.afkTimeout) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(locale.modules.logs.guild_update.types.afk_timeout)
                    .addField(locale.modules.logs.common.before_changes, before.afkTimeout, true)
                    .addField(locale.modules.logs.common.after_changes, guild.afkTimeout, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.verificationLevel != guild.verificationLevel) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(locale.commands.server.texts.verification_level)
                    .addField(locale.modules.logs.common.before_changes, locale.commands.server.texts.verification_levels[before.verificationLevel], true)
                    .addField(locale.modules.logs.common.after_changes, locale.commands.server.texts.verification_levels[guild.verificationLevel], true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.description != guild.description) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(locale.modules.logs.guild_update.types.description)
                    .addField(locale.modules.logs.common.before_changes, before.description || locale.commands.common.texts.none, true)
                    .addField(locale.modules.logs.common.after_changes, guild.description || locale.commands.common.texts.none, true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.systemChannelID != guild.systemChannelID) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(locale.modules.logs.guild_update.types.system_channel)
                    .addField(locale.modules.logs.common.before_changes, before.systemChannel ? `#${before.systemChannel.name}` : locale.commands.common.texts.none, true)
                    .addField(locale.modules.logs.common.after_changes, guild.systemChannel ? `#${guild.systemChannel.name}` : locale.commands.common.texts.none, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.ownerID != guild.ownerID) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.guild_update.title)
                    .setDescription(locale.commands.server.texts.owner)
                    .addField(locale.modules.logs.common.before_changes, before.owner ? before.owner.user.tag : `<@${before.ownerID}>`, true)
                    .addField(locale.modules.logs.common.after_changes, guild.owner ? guild.owner.user.tag : `<@${guild.ownerID}>`, true)
                    .addField('\u200B', '\u200B', true)
                    .setTimestamp()
                    .setColor(0xE19517)

                await webhook.send('', {
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