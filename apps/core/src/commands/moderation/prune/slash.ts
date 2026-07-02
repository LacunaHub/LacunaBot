import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { createCaseLogEntry } from '@/modules/Moderation/CaseLog.js'
import { BaseGuildTextChannel, ChatInputCommandInteraction } from 'discord.js'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const amount = interaction.options.getInteger('amount', true)
    const mention = interaction.options.getUser('user')
    const reason = interaction.options.getString('reason') ?? '-'

    await interaction.deferReply({ ephemeral: true })

    if (mention) {
        let messages = await interaction.channel!.messages.fetch({ limit: amount, cache: false })
        messages = messages.filter(m => m.author.id === mention.id)

        const deleted = await (interaction.channel as BaseGuildTextChannel).bulkDelete(messages, true)
        await interaction.editReply({
            content: `${self.staticEmojis.Check} | ${t('Commands.PruneCommand.Texts.MessagesHaveBeenPruned', {
                username: `**${interaction.member.displayName}**`,
                amount: deleted.size
            })}`
        })
    } else {
        const deleted = await (interaction.channel as BaseGuildTextChannel).bulkDelete(amount, true)
        await interaction.editReply({
            content: `${self.staticEmojis.Check} | ${t('Commands.PruneCommand.Texts.MessagesHaveBeenPruned', {
                username: `**${interaction.member.displayName}**`,
                amount: deleted.size
            })}`
        })
    }

    await createCaseLogEntry(interaction.guild, {
        type: 'PruneMessages',
        target: mention!,
        executor: interaction.user,
        reason
    })

    return true
}
