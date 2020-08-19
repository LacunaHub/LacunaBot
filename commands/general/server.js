const { MessageEmbed } = require('discord.js')
const moment = require('moment')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const run = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const server_owner = await message.guild.members.fetch(message.guild.ownerID)

    const embed = new MessageEmbed()
        .setAuthor(message.guild.name, message.guild.iconURL())
        .addField(locale.server.texts.owner, server_owner.user.tag, true)
        .addField(locale.server.texts.id, message.guild.id, true)
        .addField(locale.server.texts.region, locale.server.texts.regions[message.guild.region], true)
        .addField(locale.server.texts.members.title, `${message.guild.members.cache.filter(member => member.presence.status != 'offline' && !member.user.bot).size} ${locale.server.texts.members.online}\n${message.guild.memberCount} ${locale.server.texts.members.total}`, true)
        .addField(locale.server.texts.channels.title, `${message.guild.channels.cache.filter(c => c.type == 'text').size} ${locale.server.texts.channels.text}\n${message.guild.channels.cache.filter(c => c.type == 'voice').size} ${locale.server.texts.channels.voice}`, true)
        .addField(locale.server.texts.verification_level, locale.server.texts.verification_levels[message.guild.verificationLevel], true)
        .addField(locale.server.texts.afk_channel, message.guild.afkChannel ? message.guild.afkChannel.name : locale.common.texts.none, true)
        .addField(locale.server.texts.roles, message.guild.roles.cache.size, true)
        .addField(locale.server.texts.emojis, message.guild.emojis.cache.size, true)
        .setFooter(`${locale.server.texts.footer.server_created} ${moment(message.guild.createdTimestamp).locale(server.locale).format(`DD MMM YYYY [${locale.server.texts.footer.at}] HH:mm`)} (${(moment(message.guild.createdTimestamp).locale(server.locale).fromNow())})`)
        .setColor()
    
    await message.channel.send(embed)

    return true
}

module.exports = {
    fn: run,
    name: 'server',
    description: 'commands.server.description',
    group: 'general',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS']
}