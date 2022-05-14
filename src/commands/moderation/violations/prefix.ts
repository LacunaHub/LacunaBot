import { Message, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? await message.guild.members.fetch(message['args'][0]) : null)

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.violations.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == mention.id)

    if (!violator || !violator.violations.length) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.violations.texts.no_violations, `**${message.member.displayName}**`)}` })

        return false
    }

    const last_24_hours = violator.violations.filter(v => Date.now() - v.timestamp < 86400000)
    const last_7_days = violator.violations.filter(v => Date.now() - v.timestamp < 604800000)
    const last_10_violations = violator.violations.slice(Math.max(violator.violations.length - 10, 0)).sort((a, b) => a.timestamp - b.timestamp)

    const embed = new MessageEmbed()
        .setAuthor({ name: self.translator.format(locale.violations.texts.title, mention.user.tag), iconURL: mention.user.displayAvatarURL() })
        .addField(locale.violations.texts.last_24_hours, `${last_24_hours.length}`, true)
        .addField(locale.violations.texts.last_7_days, `${last_7_days.length}`, true)
        .addField(locale.violations.texts.total, `${violator.violations.length}`, true)
        .addField(
            locale.violations.texts.last_10_violations,
            last_10_violations.map((v, i) => `${i + 1}. **${v.reason || locale.common.texts.none}** – <t:${Math.round(v.timestamp / 1000)}:R> \`${v.id}\``).join('\n')
        )

    await message.reply({ embeds: [embed] })

    return true
}
