import { CommandInteraction, GuildMember, Role } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import Levels from '../../../modules/Levels'

export async function setSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const level = interaction.options?.getInteger('уровень')

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.levels.set.texts.no_mention, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!level || level < 1 || level > 2500) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.levels.set.texts.no_level, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    let total_xp = 0

    for (let i = 0; i < level; i++) {
        total_xp = total_xp + (150 + (i * i * 8))
    }

    const activity = await self.db.activities.fetch({ _id: interaction.guild.id })
    const levels = activity.levels.find(level => level.user_id == mention.id)
    
    if (!levels) {
        await self.db.activities.updateOne({ _id: interaction.guild.id }, {
            $push: {
                levels: {
                    user_id: mention.id,
                    experience: { total: total_xp, current: 0, level: level },
                    activity: {
                        text: { total_messages: 0, last_message_at: null },
                        voice: { total_time: 0, connected_at: null, disconnected_at: null }
                    }
                } as never
            }
        })
    }

    else {
        await self.db.activities.updateOne({ _id: interaction.guild.id, 'levels.user_id': mention.id }, {
            $set: {
                'levels.$.experience.level': level,
                'levels.$.experience.current': 0,
                'levels.$.experience.total': total_xp
            }
        })
    }

    await Levels.updateAwards(self, server, { member: mention, level })

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.levels.set.texts.set_success, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

    return true
}

export async function resetSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMentionable('пользователь-или-роль') as GuildMember | Role

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.levels.reset.texts.no_mention, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const is_role = 'color' in mention

    if (is_role) {
        if (mention.id == interaction.guild.id) {
            await self.db.activities.updateOne({ _id: interaction.guild.id }, {
                $set: {
                    levels: []
                }
            })
        }

        else mention.members.forEach(async member => {
            await self.db.activities.updateOne({ _id: interaction.guild.id }, {
                $pull: {
                    levels: {
                        user_id: member.id
                    } as never
                }
            })
        })
    }

    else {
        await self.db.activities.updateOne({ _id: interaction.guild.id }, {
            $pull: {
                levels: {
                    user_id: mention.id
                } as never
            }
        })
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.levels.reset.texts.reset_success, `**${(interaction.member as any).displayName}**`)}` })

    return true
}

module.exports = { setSlash, resetSlash }