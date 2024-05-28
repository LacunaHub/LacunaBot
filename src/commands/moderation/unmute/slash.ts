import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ChatInputCommandInteraction, GuildMember } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember('user') as GuildMember
    const reason = interaction.options?.getString('reason') ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.UnmuteCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!mention.isCommunicationDisabled()) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.UnmuteCommand.Texts.UserIsNotMuted', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    try {
        await mention.disableCommunicationUntil(null, reason)
    } catch (err) {
        await self.logger.handleError({ module: 'UnmuteCommand', action: 'EnableCommunication', error: err, guild_id: interaction.guildId })
    }

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

    await caseLog.createCaseEntry(interaction.guild, { type: 'MuteRemove', target: mention.user, executor: interaction.user, reason })
    await interaction.editReply({
        content: `${self.staticEmojis.OK} | ${t('Commands.UnmuteCommand.Texts.UserHasBeenUnmuted', {
            username: `**${interaction.member.displayName}**`,
            target: `**${mention.user.tag}**`
        })}`
    })

    return true
}
