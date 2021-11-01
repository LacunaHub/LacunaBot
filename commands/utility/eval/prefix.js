const util = require('util')

function clean(text) {
    if (typeof(text) === "string")
      return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203))
    else
        return text
}

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').Message} message
 */
module.exports = async (self, server, message) => {
    try {
        const code = message.args.slice(0).join(' ')
        let evaled = eval(code)

        if (typeof evaled !== 'string') evaled = util.inspect(evaled)

        await message.channel.send({ content: `**ВЫВОД**:\`\`\`xl\n${clean(evaled)}\n\`\`\`` })
    } catch(err) {
        await message.channel.send({ content: `**ОШИБКА**:\`\`\`xl\n${clean(err)}\n\`\`\`` })
    }
}