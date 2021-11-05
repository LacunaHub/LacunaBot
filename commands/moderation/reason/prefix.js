const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const case_id = isNaN(message.args[0]) ? 0 : Number(message.args[0])
    const reason = message.args.slice(1).join(' ') || '-'

    if (!case_id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_case_id, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!reason) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_reason, `**${message.member.displayName}**`)}` })

        return false
    }

    /**
     * @type {import('discord.js').TextChannel}
     */
    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)

    if (!case_log) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_case_log, `**${message.member.displayName}**`)}` })

        return false
    }

    const messages = await case_log.messages.fetch({ limit: 50 }, { cache: false })
    const case_message = messages.find(m => m.author.id == self.user.id && m.embeds[0]?.footer?.text?.includes(`#${case_id}`))

    if (!case_message) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_case_message, `**${message.member.displayName}**`)}` })

        return false
    }

    await self.db.servers.update({ _id: message.guild.id, 'moderation.case_log.cases.case_id': case_id }, {
        $set: {
            'moderation.case_log.cases.$.reason': reason
        }
    })

    const embed = new MessageEmbed(case_message.embeds[0])

    embed.fields[1].value = message.member.user.tag
    embed.fields[2].value = reason

    await case_message.edit({ embeds: [embed] })

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.reason.texts.case_edited, `**${message.member.displayName}**`)}` })

    return true
}