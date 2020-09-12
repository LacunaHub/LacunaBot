/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    /**
     * @type {import('discord.js').TextChannel}
     */
    const case_log = message.guild.channels.cache.get(server.moderation.case_log.channel_id)

    if (!case_log) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_case_log, `**${message.author.username}**`, '`/cases channel`')}`)

        return false
    }

    const case_id = args[0] ? Number(args[0]) : null
    const reason = args.slice(1).join(' ')

    if (!case_id) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_case_id, `**${message.author.username}**`)}`)

        return false
    }

    if (!reason) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_reason, `**${message.author.username}**`)}`)

        return false
    }

    const messages = await case_log.messages.fetch({ limit: 50 }, false)
    const case_message = messages.find(m => m.author.id == self.user.id && m.embeds[0] && m.embeds[0].footer && m.embeds[0].footer.text.includes(`#${case_id}`))

    if (!case_message) {
        await message.channel.send(`${self._emojis.ERROR} | ${self.translator.format(locale.reason.texts.no_case_message, `**${message.author.username}**`)}`)

        return false
    }

    await self.db.servers.update({ _id: message.guild.id, 'moderation.case_log.cases.case_id': case_id }, {
        $set: {
            'moderation.case_log.cases.$.reason': reason
        }
    })

    const embed = case_message.embeds[0]
    ResolveEmbed(embed)

    embed.fields[1].value = message.author.tag
    embed.fields[2].value = reason

    await case_message.edit(embed)
    if (message.deletable && !message.deleted) await message.delete()

    return true
}

function ResolveEmbed(embed) {
    embed.message ? delete embed.message : null
    embed.footer ? delete embed.footer.embed : null
    embed.provider ? delete embed.provider.embed : null
    embed.thumbnail ? delete embed.thumbnail.embed : null
    embed.image ? delete embed.image.embed : null
    embed.author ? delete embed.author.embed : null
    embed.fields ? embed.fields.forEach(f => delete f.embed) : null
    return embed
}

module.exports = {
    fn: execute,
    name: 'reason',
    description: 'commands.reason.description',
    group: 'moderation',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS'],
    user_permissions: ['MANAGE_ROLES']
}