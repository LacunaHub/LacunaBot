import { BaseGuildTextChannel, CommandInteraction, GuildMember } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const amount = interaction.options?.getInteger(t('commands.prune.options.amount.name'))
    const mention = interaction.options?.getMember(t('commands.prune.options.user.name')) as GuildMember
    const reason = interaction.options?.getString(t('commands.prune.options.reason.name')) ?? '-'

    if (!amount) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.prune.text_no_amount_argument', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (Math.sign(amount) != 1 || amount < 2 || amount > 100) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.prune.text_invalid_amount_argument', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    await interaction.deferReply({ ephemeral: true })

    if (mention) {
        let messages = await interaction.channel.messages.fetch({ limit: amount }, { cache: false })
        messages = messages.filter(m => m.author.id == mention.id)

        const deleted = await (interaction.channel as BaseGuildTextChannel).bulkDelete(messages, true)
        await interaction.editReply({
            content: `${self._emojis.OK} | ${t('commands.prune.text_messages_pruned', { user: `**${(interaction.member as any).displayName}**`, amount: deleted.size })}`
        })
    } else {
        const deleted = await (interaction.channel as BaseGuildTextChannel).bulkDelete(amount, true)
        await interaction.editReply({
            content: `${self._emojis.OK} | ${t('commands.prune.text_messages_pruned', { user: `**${(interaction.member as any).displayName}**`, amount: deleted.size })}`
        })
    }

    await caseLog.createCaseEntry(interaction.guild, { type: 'PRUNE_MESSAGES', target: mention.user, executor: interaction.user, reason })

    return true
}
