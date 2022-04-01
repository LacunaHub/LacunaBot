import { BaseGuildTextChannel, CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { images } from '../../../modules/Logs'
import Replacer from '../../../modules/Replacer'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.user_not_found, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!mention.kickable) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.cant_kick_user, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (mention.id == (interaction.member as any).id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.self_action, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    const case_id: number = server.moderation.case_log.cases.length + 1

    const case_log_message = new MessageEmbed()
        .setAuthor({ name: locale.common.case_log.cases.KICK, iconURL: images.KICK })
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, interaction.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter({ text: self.translator.format(locale.common.case_log.case, case_id) })
        .setTimestamp()
        .setColor('#EF5350')

    if (server.moderation.case_log.case_types_messages.KICK.active) {
        const replacer = new Replacer(null, { guild: interaction.guild, member: mention, penalty: { reason } })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.case_types_messages.KICK.dm_message)

        await mention.send(dm_message).catch(self.logger.error)
    }

    await mention.kick(reason).catch(self.logger.error)

    if (case_log && server.moderation.case_log.case_types.KICK) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.updateOne({ _id: interaction.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 2,
                    timestamp: Date.now(),
                    reason: reason,
                    target: {
                        id: mention.id,
                        name: mention.user.tag
                    },
                    executor: {
                        id: interaction.user.id,
                        name: interaction.user.tag
                    }
                }
            }
        })
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.kick.texts.user_kicked, `**${(interaction.member as any).displayName}**`, `**${mention.user.tag}**`)}`, ephemeral: true })

    return true
}