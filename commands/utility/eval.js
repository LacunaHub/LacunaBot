function clean(text) {
    if (typeof(text) === "string")
      return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203))
    else
        return text
}

/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 * @param {String[]} args
 */
const execute = async (self, server, message, args) => {
    try {
        const code = args.slice(0).join(' ')
        const evaled = eval(code)

        await message.reply(`**ВЫВОД**:\`\`\`xl\n${clean(evaled)}\n\`\`\``, { split: true, allowedMentions: { repliedUser: false } })
    } catch(err) {
        await message.reply(`**ОШИБКА**:\`\`\`xl\n${clean(err)}\n\`\`\``, { split: true, allowedMentions: { repliedUser: false } })
    }
}

module.exports = {
    fn: execute,
    name: 'eval',
    description: 'JavaScript песочница',
    developer_only: true,
    private: true,
    group: 'utility',
    guild_only: true,
    self_permissions: ['SEND_MESSAGES']
}