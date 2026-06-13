import { ServerDocument } from '@/database/schemas/Servers'
import { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js'
import ms from 'ms'
import Lacuna from '../../../internals/Lacuna'
import TemporaryRole from '../../../internals/structures/TemporaryRole'
import { generateSimpleId } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const mention = interaction.options?.getMember('user') as GuildMember
    const role = interaction.options?.getRole('role') as Role
    let duration = interaction.options?.getString('duration') as any

    duration = duration && ms(duration) ? ms(duration) : null

    if (!mention) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.TemproleCommand.Texts.InvalidUser', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!role) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.TemproleCommand.Texts.NoRole', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!duration) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.TemproleCommand.Texts.InvalidDuration', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    if (!role.editable) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.TemproleCommand.Texts.RoleIsNotEditable', {
                username: `**${interaction.member.displayName}**`
            })}`,
            ephemeral: true
        })

        return false
    }

    const has_role = self.temproles.some(r => r.user_id == mention.id && r.role_id == role.id)

    if (has_role) {
        await interaction.reply({
            content: `${self.staticEmojis.Cross} | ${t('Commands.TemproleCommand.Texts.UserAlreadyHasThisRole', {
                username: `**${interaction.member.displayName}**`
            })}`,
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
        content: `${self.staticEmojis.Check} | ${t('Commands.TemproleCommand.Texts.RoleAssignedToUser', {
            username: `**${interaction.member.displayName}**`,
            role: `**${role.name}**`,
            target: `**${mention.user.tag}**`,
            date: `<t:${Math.round(ts / 1000)}:D>`
        })}`
    })

    return true
}
