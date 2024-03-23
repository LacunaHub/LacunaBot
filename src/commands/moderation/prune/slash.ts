import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { BaseGuildTextChannel, ChatInputCommandInteraction } from 'discord.js'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const amount = interaction.options?.getInteger('amount')
    const mention = interaction.options?.getUser('user')
    const reason = interaction.options?.getString('reason') ?? '-'

    if (!amount) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.PruneCommand.Texts.InvalidAmount', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (Math.sign(amount) != 1 || amount < 2 || amount > 100) {
        await interaction.reply({
            content: `${self.staticEmojis.ERROR} | ${t('Commands.PruneCommand.Texts.InvalidAmountDiapason', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    if (mention) {
        let messages = await interaction.channel.messages.fetch({ limit: amount, cache: false })
        messages = messages.filter(m => m.author.id === mention.id)

        const deleted = await (interaction.channel as BaseGuildTextChannel).bulkDelete(messages, true)
        await interaction.editReply({
            content: `${self.staticEmojis.OK} | ${t('Commands.PruneCommand.Texts.MessagesHaveBeenPruned', {
                username: `**${interaction.member.displayName}**`,
                amount: deleted.size
            })}`
        })
    } else {
        const deleted = await (interaction.channel as BaseGuildTextChannel).bulkDelete(amount, true)
        await interaction.editReply({
            content: `${self.staticEmojis.OK} | ${t('Commands.PruneCommand.Texts.MessagesHaveBeenPruned', {
                username: `**${interaction.member.displayName}**`,
                amount: deleted.size
            })}`
        })
    }

    await caseLog.createCaseEntry(interaction.guild, { type: 'PRUNE_MESSAGES', target: mention, executor: interaction.user, reason })

    return true
}
