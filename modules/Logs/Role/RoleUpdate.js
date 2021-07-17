const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Role} before
 * @param {import('discord.js').Role} role
 */
module.exports = async (self, server, before, role) => {
    if (server.moderation.logs.types.role_update.active) {
        const locale = self.translator.locale(server.locale)

        const log = role.guild.channels.cache.get(server.moderation.logs.types.role_update.channel_id)

        const is_ok = log && role.guild.me.hasPermission('MANAGE_WEBHOOKS') && log.permissionsFor(role.guild.me).has('MANAGE_WEBHOOKS')

        if (is_ok) {
            const webhooks = await role.guild.fetchWebhooks()
            const logs_webhook = server.moderation.logs.webhooks.find(w => w.channel_id == log.id)
            let webhook = logs_webhook ? webhooks.get(logs_webhook.id) : null

            const audit = role.guild.me.hasPermission('VIEW_AUDIT_LOG') ? await role.guild.fetchAuditLogs({ limit: 1, type: 'ROLE_UPDATE' }) : null
            const executor = audit?.entries?.first()?.executor

            if (!webhook) {
                try {
                    webhook = await log.createWebhook(`${self.user.username}`, { avatar: self.user.displayAvatarURL(), reason: self.translator.format(locale.modules.logs.common.webhook_create_reason, locale.modules.logs.role_update.title) })
                } catch (err) {
                    return false
                }

                await self.db.servers.update({ _id: role.guild.id }, {
                    $push: {
                        'moderation.logs.webhooks': {
                            id: webhook.id,
                            token: webhook.token,
                            channel_id: webhook.channelID
                        }
                    }
                })
            }

            if (before.name != role.name) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.role_update.title)
                    .setDescription(self.translator.format(locale.modules.logs.role_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, self.translator.format(locale.modules.logs.role_update.types.name, `<@&${role.id}>`)))
                    .addField(locale.modules.logs.common.before_changes, before.name, true)
                    .addField(locale.modules.logs.common.after_changes, role.name, true)
                    .setFooter(role.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }

            if (before.hexColor != role.hexColor) {
                const embed = new MessageEmbed()
                    .setTitle(locale.modules.logs.role_update.title)
                    .setDescription(self.translator.format(locale.modules.logs.role_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, self.translator.format(locale.modules.logs.role_update.types.color, `<@&${role.id}>`)))
                    .addField(locale.modules.logs.common.before_changes, `\`${before.hexColor}\``, true)
                    .addField(locale.modules.logs.common.after_changes, `\`${role.hexColor}\``, true)
                    .setFooter(role.id)
                    .setTimestamp()
                    .setColor('#FFA726')

                await webhook.send('', {
                    embeds: [embed],
                    avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                    name: server.server.premium.available ? webhook.name : self.user.username
                })
            }
            
            if (before.permissions != role.permissions) {
                const before_permissions = before.permissions.toArray(false)
                const permissions = role.permissions.toArray(false)

                if (before_permissions.length < permissions.length) {
                    const perms = permissions.filter(p => !before_permissions.includes(p))

                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.role_update.title)
                        .setDescription(self.translator.format(locale.modules.logs.role_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, self.translator.format(locale.modules.logs.role_update.types.permissions, `<@&${role.id}>`)))
                        .addField(locale.modules.logs.role_update.types.permissions_added, perms.map(p => locale.commands.common.permissions[p]).join(', '), true)
                        .setFooter(role.id)
                        .setTimestamp()
                        .setColor('#FFA726')

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }

                if (before_permissions.length > permissions.length) {
                    const perms = before_permissions.filter(p => !permissions.includes(p))

                    const embed = new MessageEmbed()
                        .setTitle(locale.modules.logs.role_update.title)
                        .setDescription(self.translator.format(locale.modules.logs.role_update.template, `**${executor?.tag ?? locale.modules.logs.common.unknown_initiator}**`, self.translator.format(locale.modules.logs.role_update.types.permissions, `<@&${role.id}>`)))
                        .addField(locale.modules.logs.role_update.types.permissions_removed, perms.map(p => locale.commands.common.permissions[p]).join(', '), true)
                        .setFooter(role.id)
                        .setTimestamp()
                        .setColor('#FFA726')

                    await webhook.send('', {
                        embeds: [embed],
                        avatarURL: server.server.premium.available ? webhook.avatarURL() : self.user.avatarURL(),
                        name: server.server.premium.available ? webhook.name : self.user.username
                    })
                }
            }

            await self.emit('moduleExecution', { module: 'Logs: Role Update', guild: { id: role.guild.id, name: role.guild.name }, target: { id: role.name, name: role.id } })
        
            return true
        }
    }

    return false
}