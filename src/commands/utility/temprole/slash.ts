import { CommandInteraction, GuildMember, Role } from 'discord.js'
import ms from 'ms'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import TemporaryRole from '../../../internals/structures/TemporaryRole'
import { generateSimpleId } from '../../../internals/utility/UID'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember(t('commands.temprole.options.user.name')) as GuildMember
    const role = interaction.options?.getRole(t('commands.temprole.options.role.name')) as Role
    let duration = interaction.options?.getString(t('commands.temprole.options.duration.name')) as any

    duration = duration && ms(duration) ? ms(duration) : null

    if (!mention) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.temprole.text_no_mention', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!role) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.temprole.text_no_role', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!duration) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.temprole.text_invalid_duration', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (!role.editable) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.temprole.text_role_not_editable', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    const has_role = self.temproles.some(r => r.user_id == mention.id && r.role_id == role.id)

    if (has_role) {
        await interaction.reply({
            content: `${self._emojis.ERROR} | ${t('commands.temprole.text_has_role', { user: `**${(interaction.member as any).displayName}**` })}`,
            ephemeral: true
        })

        return false
    }

    if (duration < ms('1m')) duration = ms('1m')
    else if (duration > ms('2y')) duration = ms('2y')

    const ts = Date.now() + duration

    await interaction.deferReply({ ephemeral: true })
    await mention.roles.add(role.id)

    new TemporaryRole(self, {
        user_id: mention.id,
        guild_id: interaction.guild.id,
        role_id: role.id,
        unique_id: generateSimpleId(6),
        expires_timestamp: ts,
        initial: true
    })

    await interaction.editReply({
        content: `${self._emojis.OK} | ${t('commands.temprole.text_success', {
            user: `**${(interaction.member as any).displayName}**`,
            role: `**${role.name}**`,
            target: `**${mention.user.tag}**`,
            date: `<t:${Math.round(ts / 1000)}:D>`
        })}`
    })

    return true
}
