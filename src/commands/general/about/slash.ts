import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Team } from 'discord.js'
import numbro from 'numbro'
import os from 'os'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

const { version } = require('../../../../package.json')

export default async (self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const total_guilds = (await self.shard.fetchClientValues('guilds.cache.size')) as number[]
    const total_users = self.guilds.cache.reduce((x, y) => x + y.memberCount, 0)
    const cached_users = (await self.shard.fetchClientValues('users.cache.size')) as number[]

    const developer = await self.users.fetch((self.application.owner as Team).ownerId)

    const embed = new EmbedBuilder()
        .addFields([
            { name: t('commands.about.text_developer'), value: developer.tag, inline: true },
            { name: t('commands.about.text_version'), value: `\`${version.split('.').slice(0, 2).join('.')}\``, inline: true },
            { name: t('commands.about.text_latency'), value: `${Math.round(self.ws.ping)}`, inline: true },
            { name: t('commands.about.text_total_guilds'), value: `${total_guilds.reduce((a, b) => a + b, 0)}`, inline: true },
            { name: t('commands.about.text_total_users'), value: `${cached_users.reduce((a, b) => a + b, 0)}/${total_users}`, inline: true },
            { name: t('commands.about.text_shard_count'), value: `${self.shard.count}`, inline: true },
            { name: t('commands.about.text_os_uptime'), value: numbro(os.uptime()).format({ output: 'time' }), inline: true },
            { name: t('commands.about.text_shard_uptime'), value: numbro(self.uptime / 1000).format({ output: 'time' }), inline: true },
            { name: '\u200B', value: '\u200B', inline: true }
        ])
        .setFooter({ text: `© ${(self.application.owner as Team).name}`, iconURL: (self.application.owner as Team).iconURL() })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(t('commands.about.text_state')).setURL('https://www.voidlacuna.ru/state')
    )

    await interaction.reply({ embeds: [embed], components: [row] })

    return true
}
