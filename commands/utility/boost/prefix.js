/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    const user = await self.db.users.find({ _id: message.author.id })

    if (!user || !user.boost.points || (user.boost.points < 100 && user.boost.points != -1)) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.boost.texts.no_boost_tokens, `**${message.member.displayName}**`)}` })

        return false
    }

    if (server.server.premium.booster_id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.boost.texts.premium_already_available, `**${message.member.displayName}**`)}` })

        return false
    }

    await self.db.users.update({ _id: message.author.id }, { $set: { 'boost.points': user.boost.points == -1 ? -1 : user.boost.points - 100 } })
    await self.db.servers.update({ _id: message.guild.id }, { $set: { 'server.premium.available': true, 'server.premium.booster_id': message.author.id } })

    await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.boost.texts.boost_activated, `**${message.member.displayName}**`)}` })

    return true
}