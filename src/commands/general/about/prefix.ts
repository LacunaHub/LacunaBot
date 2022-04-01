import { MessageEmbed, MessageActionRow, MessageButton, Message, Team } from 'discord.js'
import numbro from 'numbro'
import os from 'os'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

const { version } = require('../../../../package.json')

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const total_guilds = await self.shard.fetchClientValues('guilds.cache.size') as number[]
    const total_users = self.guilds.cache.reduce((x, y) => x + y.memberCount, 0)
    const cached_users = await self.shard.fetchClientValues('users.cache.size') as number[]
    
    const developer = await self.users.fetch((self.application.owner as Team).ownerId)

    const embed = new MessageEmbed()
        .addField(locale.about.texts.developer, developer.tag, true)
        .addField(locale.about.texts.version, `\`${version.split('.').slice(0, 2).join('.')}\``, true)
        .addField(locale.about.texts.latency, `${Math.round(self.ws.ping)}`, true)
        .addField(locale.about.texts.total_guilds, `${total_guilds.reduce((a, b) => a + b, 0)}`, true)
        .addField(locale.about.texts.total_users, `${cached_users.reduce((a, b) => a + b, 0)}/${total_users}`, true)
        .addField(locale.about.texts.shards, `${self.shard.count}`, true)
        .addField(locale.about.texts.os_uptime, numbro(os.uptime()).format({ output: 'time' }), true)
        .addField(locale.about.texts.shard_uptime, numbro(self.uptime / 1000).format({ output: 'time' }), true)
        .addField('\u200B', '\u200B', true)
        .setFooter({ text: `© ${(self.application.owner as Team).name}`, iconURL: (self.application.owner as Team).iconURL() })

    const components = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setStyle('LINK')
                .setLabel(locale.about.texts.state)
                .setURL('https://www.voidlacuna.ru/state')
        )

    await message.reply({ embeds: [embed], components: [components] })

    return true
}