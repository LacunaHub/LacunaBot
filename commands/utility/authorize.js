/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
 const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const user_id = args[0]
    const user = await self.db.users.find({ _id: user_id })

    if (!user || (user.flags & 1 << 1) !== (1 << 1)) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.authorize.texts.user_not_found, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (server.server.bot_experts.some(expert => expert.id === user._id)) {
        await self.db.servers.update({ _id: message.guild.id, 'server.bot_experts.id': user._id }, {
            $set: {
                'server.bot_experts.$.expires_timestamp': Date.now() + 3600000
            }
        })
    }

    else {
        await self.db.servers.update({ _id: message.guild.id }, {
            $push: {
                'server.bot_experts': {
                    id: user._id,
                    expires_timestamp: Date.now() + 3600000
                }
            }
        })
    }

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.authorize.texts.access_granted, `**${message.author.username}**`, `**${user.user.username}#${user.user.discriminator}**`)}`, { allowedMentions: { repliedUser: false } })

    const support = await self.users.fetch(user._id, false, true)

    if (support) await support.send(`Предоставлен временный доступ к настройкам сервера **${message.guild.name}** на 1 час\n<https://www.voidlacuna.ru/guilds/${message.guild.id}/settings>`).catch(self.logger.error)

    return true
}

module.exports = {
    fn: execute,
    name: 'authorize',
    description: 'commands.authorize.description',
    group: 'utility',
    guild_only: true,
    private: true,
    self_permissions: ['SEND_MESSAGES'],
    user_permissions: ['ADMINISTRATOR']
}