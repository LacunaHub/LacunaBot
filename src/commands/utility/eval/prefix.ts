import { Message } from 'discord.js'
import util from 'util'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    try {
        const code = message['args'].slice(0).join(' ')
        let evaled = eval(code)

        if (typeof evaled !== 'string') evaled = util.inspect(evaled)

        await message.channel.send({ content: `**ВЫВОД**:\`\`\`xl\n${clean(evaled)}\n\`\`\`` })
    } catch (err) {
        await message.channel.send({ content: `**ОШИБКА**:\`\`\`xl\n${clean(err)}\n\`\`\`` })
    }
}

function clean(text: string) {
    if (typeof text === 'string') return text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
    else return text
}
