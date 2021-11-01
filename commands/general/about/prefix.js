const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')
const { version } = require('../../../package.json')
const numbro = require('numbro')
const os = require('os')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    const locale = self.translator.locale(server.locale).commands

    let total_guilds = await self.shard.fetchClientValues('guilds.cache.size')
    let total_users = await self.shard.fetchClientValues('users.cache.size')
    
    total_guilds = total_guilds.reduce((a, b) => a + b, 0)
    total_users = total_users.reduce((a, b) => a + b, 0)
    
    const developer = await self.users.fetch(self.application.owner.ownerId)

    const embed = new MessageEmbed()
        .addField(locale.about.texts.developer, developer.tag, true)
        .addField(locale.about.texts.version, `\`${version}\``, true)
        .addField(locale.about.texts.latency, `${Math.round(self.ws.ping)}`, true)
        .addField(locale.about.texts.total_guilds, `${total_guilds}`, true)
        .addField(locale.about.texts.total_users, `${total_users}`, true)
        .addField(locale.about.texts.shards, `${self.shard.count}`, true)
        .addField(locale.about.texts.os_uptime, numbro(os.uptime()).format({ output: 'time' }), true)
        .addField(locale.about.texts.shard_uptime, numbro(self.uptime / 1000).format({ output: 'time' }), true)
        .addField('\u200B', '\u200B', true)
        .setFooter(`© ${self.application.owner.name}`, self.application.owner.iconURL())

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