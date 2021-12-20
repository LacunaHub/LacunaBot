import { CommandInteraction, GuildMember, Role } from 'discord.js'
import ms from 'ms'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import TemporaryRole from '../../../internals/structures/TemporaryRole'
import { generateSimpleId } from '../../../internals/utility/UID'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const role = interaction.options?.getRole('роль') as Role
    let duration = interaction.options?.getString('длительность') as any

    duration = duration && ms(duration) ? ms(duration) : null

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.no_mention, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!role) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.no_role, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!duration) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.invalid_duration, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!role.editable) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.role_not_editable, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const has_role = self.temproles.some(r => r.user_id == mention.id && r.role_id == role.id)

    if (has_role) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.temprole.texts.has_role, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

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
        unique_id: generateSimpleId(6),
        expires_timestamp: ts,
        initial: true
    })

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.temprole.texts.success, `**${(interaction.member as any).displayName}**`, `**${role.name}**`, `**${mention.user.tag}**`, `<t:${Math.round(ts / 1000)}:D>`)}` })

    return true
}