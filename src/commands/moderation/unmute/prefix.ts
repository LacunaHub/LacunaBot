import { Message } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? await message.guild.members.fetch(message['args'][0]) : null)
    const reason = message['args'].slice(1).join(' ') || '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!mention.isCommunicationDisabled()) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_muted, `**${message.member.displayName}**`)}` })

        return false
    }

    await mention.disableCommunicationUntil(null, reason).catch(() => {})

    if (server.moderation.mutes.rar) {
        const returnable_roles = server.moderation.mutes.rar_data.find(r => r.user_id == mention.id)

        if (returnable_roles) {
            await self.db.servers.updateOne(
                { _id: message.guild.id },
                {
                    $pull: {
                        'moderation.mutes.rar_data': {
                            user_id: mention.id
                        }
                    }
                }
            )

            await mention.roles.add(returnable_roles.roles.filter(r => message.guild.roles.cache.has(r)))
        }
    }

    await caseLog.createCaseEntry(message.guild, { type: 'MUTE_REMOVE', target: mention.user, executor: message.author, reason })

    await message.reply({
        content: `${self._emojis.OK} | ${self.translator.format(locale.unmute.texts.user_unmuted, `**${message.member.displayName}**`, `**${mention.user.tag}**`)}`
    })

    return true
}
