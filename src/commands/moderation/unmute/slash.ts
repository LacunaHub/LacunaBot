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

    if (server.moderation.use_timeout_mute) {
        if (!mention.communicationDisabledUntilTimestamp) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_muted, `**${(interaction.member as any).displayName}**`)}`,
                ephemeral: true
            })

            return false
        }

        await mention.disableCommunicationUntil(null, reason).catch(() => {})
    } else {
        const mute_role = interaction.guild.roles.cache.get(server.moderation.roles.mute)
        const tempmute = self.tempmutes.find(m => m.user_id == mention.id)

        if (!mute_role?.members?.has(mention.id)) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_muted, `**${(interaction.member as any).displayName}**`)}`,
                ephemeral: true
            })

            return false
        }

        if (!mute_role.editable) {
            await interaction.reply({
                content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.cant_remove_role, `**${(interaction.member as any).displayName}**`)}`,
                ephemeral: true
            })

            return false
        }

        if (tempmute) await tempmute.delete(false)
        else {
            const returnable_roles = server.moderation.roles.on_mute.returnable_roles.find(r => r.user_id == mention.id)

            if (returnable_roles) {
                await self.db.servers.updateOne(
                    { _id: interaction.guild.id },
                    {
                        $pull: {
                            'moderation.roles.on_mute.returnable_roles': {
                                user_id: mention.id
                            }
                        }
                    }
                )

                await mention.roles.add(returnable_roles.roles.filter(r => mention.guild.roles.cache.has(r)))
            }

            await mention.roles.remove(mute_role.id, reason).catch(self.logger.error)

            if (mention.voice?.serverMute) await mention.voice.setMute(false, reason).catch(self.logger.error)
        }
    }

    await caseLog.createCaseEntry(server, interaction.guild, { type: 'MUTE_REMOVE', target: mention.user, executor: interaction.user, reason })

    await interaction.reply({
        content: `${self._emojis.OK} | ${self.translator.format(locale.unmute.texts.user_unmuted, `**${(interaction.member as any).displayName}**`, `**${mention.user.tag}**`)}`,
        ephemeral: true
    })

    return true
}
