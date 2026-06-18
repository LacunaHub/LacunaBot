import { type ServerDocument } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import numbro from 'numbro'
import os from 'os'

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const currentVersion = await self.db.qdb.get('version')
    const totalGuilds = (await self.cluster.fetchClientValues('guilds.cache.size')) as number[]
    const totalUsers = self.guilds.cache.reduce((x, y) => x + y.memberCount, 0)
    const cachedUsers = (await self.cluster.fetchClientValues('users.cache.size')) as number[]

    const embed = new EmbedBuilder().addFields([
        { name: t('Commands.AboutCommand.Texts.Developer'), value: `Lacuna Hub`, inline: true },
        { name: t('Commands.AboutCommand.Texts.CurrentVersion'), value: `\`${currentVersion}\``, inline: true },
        { name: t('Commands.AboutCommand.Texts.Shard'), value: `#${self.cluster.id}`, inline: true },
        { name: t('Commands.AboutCommand.Texts.Latency'), value: `${Math.round(self.ws.ping)}`, inline: true },
        {
            name: t('Commands.AboutCommand.Texts.TotalGuilds'),
            value: `${totalGuilds.reduce((a, b) => a + b, 0)}`,
            inline: true
        },
        {
            name: t('Commands.AboutCommand.Texts.TotalUsers'),
            value: `${cachedUsers.reduce((a, b) => a + b, 0)}/${totalUsers}`,
            inline: true
        },
        {
            name: t('Commands.AboutCommand.Texts.OSUptime'),
            // @ts-expect-error
            value: numbro(os.uptime()).format({ output: 'time' }),
            inline: true
        },
        {
            name: t('Commands.AboutCommand.Texts.ShardUptime'),
            // @ts-expect-error
            value: numbro(self.uptime! / 1000).format({ output: 'time' }),
            inline: true
        },
        { name: '\u200B', value: '\u200B', inline: true }
    ])

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel(t('Components.Header.State'))
            .setURL(`${process.env.LCN_WEBSITE_URL}/state`)
    )

    await interaction.reply({ embeds: [embed], components: [row] })

    return true
}
