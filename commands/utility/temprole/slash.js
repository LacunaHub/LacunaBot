const ms = require('ms')
const TemporaryRole = require('../../../internals/structures/TemporaryRole')
const id = require('../../../internals/utility/UID')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь')
    const role = interaction.options?.getRole('роль')
    let duration = interaction.options?.getString('длительность')

    duration = duration && ms(duration) ? ms(duration) : null

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.no_mention, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!role) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.no_role, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!duration) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.invalid_duration, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!role.editable) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.role_not_editable, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const has_role = self.temproles.some(r => r.user_id == mention.id && r.role_id == role.id)

    if (has_role) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.has_role, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (duration < ms('1m')) duration = ms('1m')
    else if (duration > ms('2y')) duration = ms('2y')

    const ts = Date.now() + duration

    await mention.roles.add(role.id)

    new TemporaryRole(self, {
        user_id: mention.id,
        guild_id: interaction.guild.id,
        role_id: role.id,
        unique_id: id.simple(6),
        expires_timestamp: ts,
        init: true
    })

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.temprole.texts.success, `**${interaction.member.displayName}**`, `**${role.name}**`, `**${mention.user.tag}**`, `<t:${Math.round(ts / 1000)}:D>`)}` })

    return true
}