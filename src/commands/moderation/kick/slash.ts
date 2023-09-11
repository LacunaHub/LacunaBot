import { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'
import Replacer from '../../../modules/Replacer'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember('user') as GuildMember
    const reason = interaction.options?.getString('reason') ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.kick.text_user_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.id === (interaction.member as any).id) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.kick.text_self_action', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!mention.kickable) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.kick.text_cant_kick_user', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.respect_hierarchy && mention.roles.highest.position > (interaction.member as any).roles.highest.position) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_higher', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (server.moderation.deny_moderate_users_with_mp && mention.permissions.has(self.PermissionFlags.KickMembers)) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_is_moderator', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (mention.roles.cache.some(i => server.moderation.unmoderated_roles.includes(i.id))) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.ban.text_user_has_unmoderated_roles', {
                user: `**${(interaction.member as any).displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    if (server.moderation.case_log.types.KICK.active) {
        const replacer = new Replacer(null, { guild: interaction.guild, member: mention, penalty: { reason } })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.types.KICK.dm_message)

        try {
            await mention.send(dm_message)
        } catch (err) {
            await self.logger.handleError({ module: 'KickCommand', action: 'SendDirectMessage', error: err, guild_id: interaction.guildId })
        }
    }

    try {
        await mention.kick(reason)
    } catch (err) {
        await self.logger.handleError({ module: 'KickCommand', action: 'Kick', error: err, guild_id: interaction.guildId })
    }

    await caseLog.createCaseEntry(interaction.guild, { type: 'KICK', target: mention.user, executor: interaction.user, reason })
    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('commands.kick.text_user_kicked', {
            user: `**${(interaction.member as any).displayName}**`,
            target: `**${mention.user.tag}**`
        })}`
    })

    return true
}
