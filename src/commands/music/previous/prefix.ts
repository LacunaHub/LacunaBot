import { Message } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const player = self.player.get(message.guild.id)

    if (!player) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.stop.texts.no_track_playback, `**${message.member.displayName}**`)}` })

        return false
    }

    if (player.voiceChannel != message.member.voice.channelId) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.repeat.texts.different_voice, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!player.queue.previous) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.previous.texts.no_previous_track, `**${message.member.displayName}**`)}` })

        return false
    }

    await player.play(player.queue.previous)
    player.queue.add(player.queue.previous, 0)
    await message.reply({ content: `${self._emojis.OK}` })

    return true
}
