const { MessageEmbed } = require('discord.js')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const server_owner = await message.guild.fetchOwner()

    const created_ts = Math.round(message.guild.createdTimestamp / 1000)

    const embed = new MessageEmbed()
        .setAuthor(message.guild.name, message.guild.iconURL())
        .addField(locale.server.texts.bonused, server.server.premium.available ? self._emojis.OK : self._emojis.ERROR)
        .addField(locale.server.texts.owner, server_owner.user.tag, true)
        .addField(locale.server.texts.id, message.guild.id, true)
        .addField(locale.server.texts.members.title, `${message.guild.memberCount} ${locale.server.texts.members.total}`, true)
        .addField(locale.server.texts.channels.title, `${message.guild.channels.cache.filter(c => c.type == 'text').size} ${locale.server.texts.channels.text}\n${message.guild.channels.cache.filter(c => c.type == 'voice').size} ${locale.server.texts.channels.voice}`, true)
        .addField(locale.server.texts.verification_level, locale.server.texts.verification_levels[message.guild.verificationLevel], true)
        .addField(locale.server.texts.afk_channel, message.guild?.afkChannel?.name ?? '-', true)
        .addField(locale.server.texts.roles, `${message.guild.roles.cache.size}`, true)
        .addField(locale.server.texts.emojis, `${message.guild.emojis.cache.size}`, true)
        .addField('\u200B', '\u200B', true)
        .addField('\u200B', `${locale.server.texts.footer.server_created} <t:${created_ts}:d> – <t:${created_ts}:R>`)

    if (message.guild.description) embed.setDescription(message.guild.description)
    
    await message.reply({ embeds: [embed] })

    return true
}