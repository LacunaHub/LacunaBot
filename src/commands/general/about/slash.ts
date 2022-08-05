import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed, Team } from 'discord.js'
import numbro from 'numbro'
import os from 'os'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

const { version } = require('../../../../package.json')

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const t = self.i18n.t.bind(null, server.locale)

    const total_guilds = (await self.shard.fetchClientValues('guilds.cache.size')) as number[]
    const total_users = self.guilds.cache.reduce((x, y) => x + y.memberCount, 0)
    const cached_users = (await self.shard.fetchClientValues('users.cache.size')) as number[]

    const developer = await self.users.fetch((self.application.owner as Team).ownerId)

    const embed = new MessageEmbed()
        .addField(t('commands.about.text_developer'), developer.tag, true)
        .addField(t('commands.about.text_version'), `\`${version.split('.').slice(0, 2).join('.')}\``, true)
        .addField(t('commands.about.text_latency'), `${Math.round(self.ws.ping)}`, true)
        .addField(t('commands.about.text_total_guilds'), `${total_guilds.reduce((a, b) => a + b, 0)}`, true)
        .addField(t('commands.about.text_total_users'), `${cached_users.reduce((a, b) => a + b, 0)}/${total_users}`, true)
        .addField(t('commands.about.text_shard_count'), `${self.shard.count}`, true)
        .addField(t('commands.about.text_os_uptime'), numbro(os.uptime()).format({ output: 'time' }), true)
        .addField(t('commands.about.text_shard_uptime'), numbro(self.uptime / 1000).format({ output: 'time' }), true)
        .addField('\u200B', '\u200B', true)
        .setFooter({ text: `© ${(self.application.owner as Team).name}`, iconURL: (self.application.owner as Team).iconURL() })

    const components = new MessageActionRow().addComponents(
        new MessageButton().setStyle('LINK').setLabel(t('commands.about.text_state')).setURL('https://www.voidlacuna.ru/state')
    )

    await interaction.reply({ embeds: [embed], components: [components] })

    return true
}
