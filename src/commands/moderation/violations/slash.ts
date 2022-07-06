import { CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember(t('commands.violations.options.user.name')) as GuildMember

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.violations.text_user_not_found', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == mention.id)

    if (!violator || !violator.violations.length) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.violations.text_no_violations', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const last_24_hours = violator.violations.filter(v => Date.now() - v.timestamp < 86400000)
    const last_7_days = violator.violations.filter(v => Date.now() - v.timestamp < 604800000)
    const last_10_violations = violator.violations.slice(Math.max(violator.violations.length - 10, 0)).sort((a, b) => a.timestamp - b.timestamp)

    const embed = new MessageEmbed()
        .setAuthor({ name: t('commands.violations.text_user_violations', mention.user.tag), iconURL: mention.user.displayAvatarURL() })
        .addField(t('commands.violations.text_last_24_hours'), `${last_24_hours.length}`, true)
        .addField(t('commands.violations.text_last_7_days'), `${last_7_days.length}`, true)
        .addField(t('commands.violations.text_total_violations'), `${violator.violations.length}`, true)
        .addField(
            t('commands.violations.text_last_10_violations'),
            last_10_violations.map((v, i) => `${i + 1}. **${v.reason || '-'}** – <t:${Math.round(v.timestamp / 1000)}:R> \`${v.id}\``).join('\n')
        )

    await interaction.reply({ embeds: [embed], ephemeral: true })

    return true
}
