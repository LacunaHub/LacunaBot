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

    const volume = message['args'][0] ? Number(message['args'][0]) : null

    if (!volume || isNaN(volume)) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.volume.texts.invalid_volume, `**${message.member.displayName}**`)}` })

        return false
    }

    if (volume < 1 || volume > 100) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.volume.texts.volume_diapason, `**${message.member.displayName}**`)}` })

        return false
    }

    const volume_before = player.volume

    player.setVolume(volume)
    await message.reply({
        content: `${self._emojis.OK} | ${self.translator.format(locale.volume.texts.volume_changed, `**${message.member.displayName}**`, volume_before, volume)}`
    })

    await self.db.servers.updateOne(
        { _id: message.guild.id },
        {
            $set: {
                'modules.music.default_volume': volume
            }
        }
    )

    return true
}
