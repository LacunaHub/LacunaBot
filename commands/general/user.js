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

    const mention = message.mentions.users.first() || args[0]
    const member = mention ? await message.guild.members.fetch({ user: mention, cache: false }) : null

    const specified = member ? member : message.member

    const status = locale.user.texts.statuses[specified.presence.status]
    const activity = specified.presence.activities[0]

    const game = {
        name: activity && activity.name ? activity.name : '',
        url: activity && activity.url ? activity.url : null,
        type: activity && activity.type ? activity.type : null,
        state: activity && activity.state ? activity.state : '',
        emoji: activity && activity.emoji ? activity.emoji.id ? null : activity.emoji.name : null
    }

    if (!game.type) game.name = status
    else if (game.type == 'PLAYING') game.name = `${locale.user.texts.presence.playing} **${game.name}**`
    else if (game.type == 'STREAMING') game.name = `${locale.user.texts.presence.streaming} [**${game.name}**](${game.url})`
    else if (game.type == 'LISTENING') game.name = `${locale.user.texts.presence.listening_to} **${game.name}**`
    else if (game.type == 'WATCHING') game.name = `${locale.user.texts.presence.watching} **${game.name}**`
    else if (game.type == 'CUSTOM_STATUS') game.name = `${game.emoji ? `${game.emoji} ` : ''}${game.state}`

    const name = specified.nickname ? `${specified.user.tag} — ${specified.nickname}` : specified.user.tag

    const embed = new MessageEmbed()
        .setAuthor(name, specified.user.displayAvatarURL())
        .addField(locale.user.texts.account_created, `${moment(specified.user.createdTimestamp).locale(server.locale).format(`DD MMM YYYY [${locale.common.texts.at}] HH:mm`)}\n(${moment(specified.user.createdTimestamp).locale(server.locale).fromNow()})`, true)
        .addField(locale.user.texts.member_joined, `${moment(specified.joinedTimestamp).locale(server.locale).format(`DD MMM YYYY [${locale.common.texts.at}] HH:mm`)}\n(${moment(specified.joinedTimestamp).locale(server.locale).fromNow()})`, true)
        .addField(locale.user.texts.permissions, specified.permissions.toArray().map(p => locale.common.permissions[p]).join(', '))
        .addField(`${locale.user.texts.roles} [${specified.roles.cache.filter(r => r.id != message.guild.id).size}]`, specified.roles.cache.filter(r => r.id != message.guild.id).map(role => role.name) || locale.common.texts.none)
        .setColor(specified.displayHexColor)
        .setFooter(`ID: ${specified.id}`)

    await message.channel.send(embed)

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