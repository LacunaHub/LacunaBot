import { MessageEmbed, MessageActionRow, MessageButton, CommandInteraction, Message } from 'discord.js'
import numbro from 'numbro'
import { LevelActivities } from '../../../database/schemas/ServerActivities'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { chunkArray, isSnowflake } from '../../../internals/utility/Utils'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.levels.active && !server.modules.levels.voice) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.levels_is_disabled, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const activity = await self.db.activities.findOne({ _id: interaction.guild.id })

    if (!activity || !activity.levels.length) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.leaders.texts.no_activity, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const sorted = activity.levels.sort((a, b) => b.experience.total - a.experience.total)
    const chunks: Array<LevelActivities[]> = chunkArray(sorted, 9)
    let page: number = 0

    const embed = new MessageEmbed()
        .setTitle(locale.leaders.texts.leaderboard)

    const fields = []

    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true })

    for (const chunk of chunks) {
        const current = []

        for (const level of chunk) {
            const index = sorted.indexOf(level)

            const current_xp_format = level.experience.current >= 1000 ? numbro(Math.floor(level.experience.current)).format({ average: true, mantissa: 1 }).toUpperCase() : level.experience.current.toFixed(1)
            const total_xp_format = level.experience.total >= 1000 ? numbro(Math.floor(level.experience.total)).format({ average: true, mantissa: 1 }).toUpperCase() : level.experience.total.toFixed(1)
            const voice_time = numbro(level.activity.voice.total_time).format({ output: 'time' })

            current.push({
                name: `#${index + 1} ${level.user_id}`,
                value: `${self.translator.format(locale.leaders.texts.level, level.experience.level)} → :sparkles: ${current_xp_format} – ${total_xp_format}\n:incoming_envelope: ${level.activity.text.total_messages} :microphone2: ${voice_time}`,
                inline: true
            })
        }

        fields.push(current)
    }

    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('backward')
                .setStyle('SECONDARY')
                .setLabel('Previous')
                .setDisabled(fields.length == 1),
            new MessageButton()
                .setCustomId('forward')
                .setStyle('SECONDARY')
                .setLabel('Next')
                .setDisabled(fields.length == 1)
        )

    const field = fields[page]

    for (const chunk of field) {
        const [ index, user_id ] = chunk.name.split(' ')
        const member = isSnowflake(user_id) ? (await interaction.guild.members.fetch(user_id).catch(() => {})) : user_id

        chunk.name = `${index} ${member?.displayName ?? user_id}`
    }

    const message = await interaction.editReply({
        embeds: [ embed.setFields(field).setFooter(self.translator.format(locale.leaders.texts.pagination, (page + 1), chunks.length)) ],
        components: [row]
    }) as Message

    const collector = message.createMessageComponentCollector({
        componentType: 'BUTTON',
        filter: i => row.components.some(c => c.customId == i.customId),
        time: 60000
    })

    collector.on('collect', async i => {
        switch (i.customId) {
            case row.components[0].customId:
                page = page <= 0 ? (fields.length - 1) : (page - 1)
            break

            case row.components[1].customId:
                page = (page + 1) >= fields.length ? 0 : (page + 1)
            break
        }

        await i.deferUpdate()
        const field = fields[page]

        for (const chunk of field) {
            const [ index, user_id ] = chunk.name.split(' ')
            const member = isSnowflake(user_id) ? (await interaction.guild.members.fetch(user_id).catch(() => {})) : user_id

            chunk.name = `${index} ${member?.displayName ?? user_id}`
        }

        await i.editReply({
            embeds: [ embed.setFields(field).setFooter(self.translator.format(locale.leaders.texts.pagination, (page + 1), chunks.length)) ],
            components: [row]
        })

        collector.resetTimer()
    })

    return true
}