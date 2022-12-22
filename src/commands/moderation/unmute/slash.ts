import { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember(t('commands.unmute.options.user.name')) as GuildMember
    const reason = interaction.options?.getString(t('commands.unmute.options.reason.name')) ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.unmute.text_user_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!mention.isCommunicationDisabled()) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.unmute.text_user_not_muted', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })
    await mention.disableCommunicationUntil(null, reason).catch(() => {})

    if (server.moderation.mutes.rar) {
        const returnable_roles = server.moderation.mutes.rar_data.find(r => r.user_id == mention.id)

        if (returnable_roles) {
            await self.db.servers.updateOne(
                { _id: interaction.guildId },
                {
                    $pull: {
                        'moderation.mutes.rar_data': {
                            user_id: mention.id
                        }
                    }
                }
            )

            await mention.roles.add(returnable_roles.roles.filter(r => interaction.guild.roles.cache.has(r)))
        }
    }

    await caseLog.createCaseEntry(interaction.guild, { type: 'MUTE_REMOVE', target: mention.user, executor: interaction.user, reason })

    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('commands.unmute.text_user_unmuted', {
            user: `**${(interaction.member as any).displayName}**`,
            target: `**${mention.user.tag}**`
        })}`
    })

    return true
}
