import { BaseGuildTextChannel, CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { images } from '../../../modules/Logs'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const amount = interaction.options?.getInteger('количество')
    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!amount) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.no_amount_argument, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (Math.sign(amount) != 1 || amount < 2 || amount > 100) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.invalid_amount_argument, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (mention) {
        let messages = await interaction.channel.messages.fetch({ limit: amount }, { cache: false })
        messages = messages.filter(m => m.author.id == mention.id)

        const deleted = await (interaction.channel as BaseGuildTextChannel).bulkDelete(messages, true)
        await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${(interaction.member as any).displayName}**`, deleted.size)}`, ephemeral: true })
    }

    else {
        const deleted = await (interaction.channel as BaseGuildTextChannel).bulkDelete(amount, true)
        await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${(interaction.member as any).displayName}**`, deleted.size)}`, ephemeral: true })
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    const case_id: number = server.moderation.case_log.cases.length + 1

    const case_log_message = new MessageEmbed()
        .setAuthor({ name: locale.common.case_log.cases.PRUNE, iconURL: images.PRUNE_MESSAGES })
        .addField(locale.common.case_log.target, mention ? mention.user.tag : locale.common.texts.none, true)
        .addField(locale.common.case_log.executor, interaction.user.tag, true)
        .addField(locale.common.case_log.reason, `${reason} (<#${interaction.channel.id}>)`)
        .setFooter({ text: self.translator.format(locale.common.case_log.case, case_id) })
        .setTimestamp()
        .setColor('#EF5350')

    if (case_log && server.moderation.case_log.case_types.PRUNE_MESSAGES) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.updateOne({ _id: interaction.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 5,
                    timestamp: Date.now(),
                    reason: reason ? `${amount}:${reason}` : '',
                    target: {
                        id: mention ? mention.id : '',
                        name: mention ? mention.user.tag : ''
                    },
                    executor: {
                        id: interaction.user.id,
                        name: interaction.user.tag
                    }
                }
            }
        })
    }

    return true
}