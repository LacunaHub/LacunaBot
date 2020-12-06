/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    const locale = self.translator.locale(server.locale).commands

    const user = await self.db.users.find({ _id: message.author.id })

    if (!user || !user.boost.available) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.boost.texts.no_boost_tokens, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (server.server.premium.available) {
        await message.reply(`${self._emojis.ERROR} | ${self.translator.format(locale.boost.texts.premium_already_available, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

        return false
    }

    if (user.boost.tier <= user.boost.guilds.length) {
        const removed = user.boost.guilds.splice(user.boost.guilds.length - 1, user.boost.tier)

        for (const rem of removed) {
            await self.db.servers.update({ _id: rem.id }, {
                $set: {
                    'server.premium.available': false
                }
            })
        }

        await self.db.users.update({ _id: message.author.id }, {
            $set: {
                'boost.guilds': user.boost.guilds
            }
        })
    }

    await self.db.users.update({ _id: message.author.id }, {
        $push: {
            'boost.guilds': {
                $each: [
                    {
                        id: message.guild.id,
                        timestamp: Date.now()
                    }
                ],
                $position: 0
            }
        }
    })

    await self.db.servers.update({ _id: message.guild.id }, {
        $set: {
            'server.premium.available': true
        }
    })

    await message.reply(`${self._emojis.OK} | ${self.translator.format(locale.boost.texts.boost_activated, `**${message.author.username}**`)}`, { allowedMentions: { repliedUser: false } })

    return true
}

module.exports = {
    fn: execute,
    name: 'boost',
    description: 'commands.boost.description',
    group: 'utility',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES']
}