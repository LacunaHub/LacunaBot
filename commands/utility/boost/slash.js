/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    const user = await self.db.users.find({ _id: interaction.user.id })

    if (!user || !user.boost.points || (user.boost.points < 100 && user.boost.points != -1)) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.boost.texts.no_boost_tokens, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (server.server.premium.booster_id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.boost.texts.premium_already_available, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    await self.db.users.update({ _id: interaction.user.id }, { $set: { 'boost.points': user.boost.points == -1 ? -1 : user.boost.points - 100 } })
    await self.db.servers.update({ _id: interaction.guild.id }, { $set: { 'server.premium.available': true, 'server.premium.booster_id': interaction.user.id } })

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.boost.texts.boost_activated, `**${interaction.member.displayName}**`)}` })

    return true
}