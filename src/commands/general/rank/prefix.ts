import { Message, MessageAttachment } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { generateRankCard } from '../../../modules/Levels'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    if (!server.modules.levels.active && !server.modules.levels.voice) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.levels_is_disabled, `**${message.member.displayName}**`)}` })

        return false
    }

    let attachment: MessageAttachment

    try {
        attachment = await generateRankCard(self, message)
    } catch (err) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.error_on_render, `**${message.member.displayName}**`)}` })

        console.log(err)

        return false
    }

    if (!attachment) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.rank.texts.no_rank_card, `**${message.member.displayName}**`)}` })

        return false
    }

    await message.reply({ files: [attachment] })

    return true
}
