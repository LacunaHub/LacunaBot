import { CommandInteraction, GuildMember } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_found, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    if (!mention.isCommunicationDisabled()) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_muted, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

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

    await caseLog.createCaseEntry(server, interaction.guild, { type: 'MUTE_REMOVE', target: mention.user, executor: interaction.user, reason })

    await interaction.reply({
        content: `${self._emojis.OK} | ${self.translator.format(
            locale.unmute.texts.user_unmuted,
            `**${(interaction.member as any).displayName}**`,
            `**${mention.user.tag}**`
        )}`,
        ephemeral: true
    })

    return true
}
