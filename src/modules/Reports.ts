import { ButtonInteraction, GuildMember, SelectMenuInteraction } from 'discord.js'
import ms from 'ms'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import TemporaryBan from '../internals/structures/TemporaryBan'
import TemporaryMute from '../internals/structures/TemporaryMute'
import { caseLog, warnings } from './Moderation'

export async function buttonPressed(self: Lacuna, server: ServerDocument, interaction: ButtonInteraction) {
    const [, action, user_id] = interaction.customId.split('-')

    const member = await interaction.guild.members.fetch(user_id).catch(() => {})
    const locale = self.translator.locale(server.locale)
    const reason = 'Репорты'

    if (!member) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.ban.texts.user_not_found, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return
    }

    if (member.id == interaction.user.id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.ban.texts.self_action, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return
    }

    if (server.moderation.respect_hierarchy && member.roles.highest.position > (interaction.member as any).roles.highest.position) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.ban.texts.user_is_higher, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && member.permissions.has(self.PERMISSIONS_FLAGS[action == 'KICK' ? 'KICK_MEMBERS' : 'MANAGE_ROLES'])) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.ban.texts.user_is_moderator, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (member.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(
                locale.commands.ban.texts.user_has_unmoderated_roles,
                `**${(interaction.member as any).displayName}**`
            )}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (action == 'KICK') {
        if (!interaction.memberPermissions.has(self.PERMISSIONS_FLAGS.KICK_MEMBERS)) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(
                    locale.commands.common.texts.command_denied,
                    `**${(interaction.member as any).displayName}**`
                )}`,
                ephemeral: true
            })

            return
        }

        if (!member.kickable) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.kick.texts.cant_kick_user, `**${(interaction.member as any).displayName}**`)}`,
                ephemeral: true
            })

            return
        }

        await member.kick(reason).catch(() => {})
        await caseLog.createCaseEntry(server, interaction.guild, { type: 'KICK', target: member.user, executor: interaction.user, reason })
    }

    if (action == 'WARN') {
        if (!interaction.memberPermissions.has(self.PERMISSIONS_FLAGS.MANAGE_ROLES)) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(
                    locale.commands.common.texts.command_denied,
                    `**${(interaction.member as any).displayName}**`
                )}`,
                ephemeral: true
            })

            return
        }

        await warnings.addWarn(self, server, interaction, { target: member, executor: interaction.member as any, reason })
    }

    await removeComponentsFromMessage(interaction)
}

export async function optionSelected(self: Lacuna, server: ServerDocument, interaction: SelectMenuInteraction) {
    const [, action, user_id] = interaction.customId.split('-')
    const member = (await interaction.guild.members.fetch(user_id).catch(() => {})) as GuildMember
    const locale = self.translator.locale(server.locale)
    const duration = interaction.values[0]
    const reason = 'Репорты'

    if (!member) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.ban.texts.user_not_found, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return
    }

    if (member.id == interaction.user.id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.ban.texts.self_action, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return
    }

    if (server.moderation.respect_hierarchy && member.roles.highest.position > (interaction.member as any).roles.highest.position) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.ban.texts.user_is_higher, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && member.permissions.has(self.PERMISSIONS_FLAGS[action == 'BAN' ? 'BAN_MEMBERS' : 'MODERATE_MEMBERS'])) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.ban.texts.user_is_moderator, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (member.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(
                locale.commands.ban.texts.user_has_unmoderated_roles,
                `**${(interaction.member as any).displayName}**`
            )}`,
            ephemeral: true
        })

        await removeComponentsFromMessage(interaction)

        return false
    }

    if (action == 'BAN') {
        if (!interaction.memberPermissions.has(self.PERMISSIONS_FLAGS.BAN_MEMBERS)) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(
                    locale.commands.common.texts.command_denied,
                    `**${(interaction.member as any).displayName}**`
                )}`,
                ephemeral: true
            })

            return
        }

        if (!member.bannable) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.ban.texts.cant_ban_user, `**${(interaction.member as any).displayName}**`)}`,
                ephemeral: true
            })

            return
        }

        if (duration == 'indefinitely') {
            await interaction.guild.members.ban(member, { reason }).catch(() => {})
        } else {
            new TemporaryBan(self, {
                user_id: member.id,
                guild_id: interaction.guild.id,
                expires_timestamp: Date.now() + ms(duration),
                reason,
                initial: true
            })
        }

        await caseLog.createCaseEntry(server, interaction.guild, { type: 'BAN_ADD', target: member.user, executor: interaction.user, reason })
    }

    if (action == 'MUTE') {
        if (!interaction.memberPermissions.has(self.PERMISSIONS_FLAGS.MODERATE_MEMBERS)) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(
                    locale.commands.common.texts.command_denied,
                    `**${(interaction.member as any).displayName}**`
                )}`,
                ephemeral: true
            })

            return
        }

        if (!member.manageable) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.commands.mute.texts.cant_mute_user, `**${(interaction.member as any).displayName}**`)}`,
                ephemeral: true
            })

            return
        }

        if (server.moderation.use_timeout_mute) {
            await member.disableCommunicationUntil(Date.now() + ms(duration), reason)
        } else {
            const muteRole = interaction.guild.roles.cache.get(server.moderation.roles.mute)
            const expires_timestamp = Date.now() + ms(duration)

            if (!muteRole) {
                await interaction.reply({
                    content: `${self._emojis.ERROR} | ${self.translator.format(
                        locale.commands.mute.texts.mute_role_not_found,
                        `**${(interaction.member as any).displayName}**`
                    )}`,
                    ephemeral: true
                })

                return
            }

            new TemporaryMute(self, {
                user_id: member.id,
                guild_id: interaction.guild.id,
                role_id: muteRole.id,
                expires_timestamp: expires_timestamp,
                reason,
                initial: true
            })
        }

        await caseLog.createCaseEntry(server, interaction.guild, { type: 'MUTE_ADD', target: member.user, executor: interaction.user, reason })
    }

    await removeComponentsFromMessage(interaction)
}

async function removeComponentsFromMessage(interaction: ButtonInteraction | SelectMenuInteraction) {
    const message = await interaction.channel.messages.fetch(interaction.message.id)
    await message?.edit({ components: [] })
}

export default {
    buttonPressed,
    optionSelected
}
