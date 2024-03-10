import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Team } from 'discord.js'
import numbro from 'numbro'
import os from 'os'
import Lacuna from '../../../internals/Lacuna'

const { version } = require('../../../../package.json')

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction<'cached'>) => {
    const t = self.i18n.t.bind(null, server.locale)

    const appTeam = self.application.owner as Team
    const totalGuilds = (await self.cluster.fetchClientValues('guilds.cache.size')) as number[]
    const totalUsers = self.guilds.cache.reduce((x, y) => x + y.memberCount, 0)
    const cachedUsers = (await self.cluster.fetchClientValues('users.cache.size')) as number[]

    const embed = new EmbedBuilder()
        .addFields([
            { name: t('Commands.AboutCommand.Texts.Developer'), value: appTeam.name, inline: true },
            { name: t('Commands.AboutCommand.Texts.CurrentVersion'), value: `\`${version.split('.').slice(0, 2).join('.')}\``, inline: true },
            { name: t('Commands.AboutCommand.Texts.Shard'), value: `${self.hostname}#${self.cluster.id}`, inline: true },
            { name: t('Commands.AboutCommand.Texts.Latency'), value: `${Math.round(self.ws.ping)}`, inline: true },
            { name: t('Commands.AboutCommand.Texts.TotalGuilds'), value: `${totalGuilds.reduce((a, b) => a + b, 0)}`, inline: true },
            { name: t('Commands.AboutCommand.Texts.TotalUsers'), value: `${cachedUsers.reduce((a, b) => a + b, 0)}/${totalUsers}`, inline: true },
            { name: t('Commands.AboutCommand.Texts.OSUptime'), value: numbro(os.uptime()).format({ output: 'time' }), inline: true },
            { name: t('Commands.AboutCommand.Texts.ShardUptime'), value: numbro(self.uptime / 1000).format({ output: 'time' }), inline: true },
            { name: '\u200B', value: '\u200B', inline: true }
        ])
        .setFooter({ text: `© ${appTeam.name}`, iconURL: appTeam.iconURL() })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('Components.Header.State')).setURL(`${process.env.WEBSITE_URL}/state`)
    )

    await interaction.reply({ embeds: [embed], components: [row] })

    return true
}
