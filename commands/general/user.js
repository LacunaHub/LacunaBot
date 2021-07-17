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

    const flags = mention.user.flags.serialize()
    const badges = []

    if (flags.DISCORD_EMPLOYEE) badges.push('<:staff:314068430787706880>')
    if (flags.PARTNERED_SERVER_OWNER) badges.push('<:partnernew:754032603081998336>')
    if (flags.HYPESQUAD_EVENTS) badges.push('<:hs_events:499516789605269514>')
    if (flags.HOUSE_BRAVERY) badges.push('<:bravery:481759491961126922>')
    if (flags.HOUSE_BRILLIANCE) badges.push('<:brilliance:481759492380295168>')
    if (flags.HOUSE_BALANCE) badges.push('<:balance:481759491453616148>')
    if (flags.BUGHUNTER_LEVEL_1) badges.push('<:bughunter:464402287599681540>')
    if (flags.BUGHUNTER_LEVEL_2) badges.push('<:bughunter:464402287599681540>')
    if (flags.EARLY_VERIFIED_DEVELOPER) badges.push('<:verified_bot_developer:850039111963901992>')
    if (flags.EARLY_SUPPORTER) badges.push('<:supporter:585763690868113455>')
    if (mention.premiumSinceTimestamp) badges.push('<:nitro:464402288593731585>')

    const created_ts = Math.round(mention.user.createdTimestamp / 1000)
    const joined_ts = Math.round(mention.joinedTimestamp / 1000)

    const embed = new MessageEmbed()
        .setAuthor(name, mention.user.displayAvatarURL())
        .addField(locale.user.texts.account_created, `<t:${created_ts}> – <t:${created_ts}:R>`, true)
        .addField(locale.user.texts.member_joined, `<t:${joined_ts}> – <t:${joined_ts}:R>`, true)
        .addField(`${locale.user.texts.roles} [${mention.roles.cache.filter(r => r.id != message.guild.id).size}]`, mention.roles.cache.filter(r => r.id != message.guild.id).map(role => role.name).join(', ') || locale.common.texts.none)
        .setFooter(`ID: ${mention.id}`)

    if (badges.length) embed.setDescription(badges.map(badge => badge).join(' '))

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