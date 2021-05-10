const { MessageEmbed } = require('discord.js')
const moment = require('moment')

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    /**
     * @type {import('discord.js').GuildMember}
     */
    const mention = message.mentions.members.first() || (self.utils.isSnowflake(args[0]) ? await message.guild.members._fetchSingle({ user: args[0], cache: false }) : null) || message.member

    const name = mention.nickname ? `${mention.user.tag} — ${mention.nickname}` : mention.user.tag

    const embed = new MessageEmbed()
        .setAuthor(name, mention.user.displayAvatarURL())
        .addField(locale.user.texts.account_created, `${moment(mention.user.createdTimestamp).locale(server.locale).format(`DD MMM YYYY [${locale.common.texts.at}] HH:mm`)}\n(${moment(mention.user.createdTimestamp).locale(server.locale).fromNow()})`, true)
        .addField(locale.user.texts.member_joined, `${moment(mention.joinedTimestamp).locale(server.locale).format(`DD MMM YYYY [${locale.common.texts.at}] HH:mm`)}\n(${moment(mention.joinedTimestamp).locale(server.locale).fromNow()})`, true)
        .addField(`${locale.user.texts.roles} [${mention.roles.cache.filter(r => r.id != message.guild.id).size}]`, mention.roles.cache.filter(r => r.id != message.guild.id).map(role => role.name).join(', ') || locale.common.texts.none)
        .setColor(mention.displayHexColor)
        .setFooter(`ID: ${mention.id}`)

    await message.reply({ embed: embed, allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'user',
    description: 'commands.user.description',
    group: 'general',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES', 'EMBED_LINKS']
}