import { BaseGuildTextChannel, CommandInteraction, GuildMember } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const amount = interaction.options?.getInteger('количество')
    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!amount) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.no_amount_argument, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    if (Math.sign(amount) != 1 || amount < 2 || amount > 100) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.prune.texts.invalid_amount_argument, `**${(interaction.member as any).displayName}**`)}`,
            ephemeral: true
        })

        return false
    }

    if (mention) {
        let messages = await interaction.channel.messages.fetch({ limit: amount }, { cache: false })
        messages = messages.filter(m => m.author.id == mention.id)

        const deleted = await (interaction.channel as BaseGuildTextChannel).bulkDelete(messages, true)
        await interaction.reply({
            content: `${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${(interaction.member as any).displayName}**`, deleted.size)}`,
            ephemeral: true
        })
    } else {
        const deleted = await (interaction.channel as BaseGuildTextChannel).bulkDelete(amount, true)
        await interaction.reply({
            content: `${self._emojis.OK} | ${self.translator.format(locale.prune.texts.messages_pruned, `**${(interaction.member as any).displayName}**`, deleted.size)}`,
            ephemeral: true
        })
    }

    await caseLog.createCaseEntry(server, interaction.guild, { type: 'PRUNE_MESSAGES', target: mention.user, executor: interaction.user, reason })

    return true
}
