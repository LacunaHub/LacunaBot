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

    if (server.moderation.use_timeout_mute) {
        if (!mention.communicationDisabledUntilTimestamp) {
            await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_muted, `**${message.member.displayName}**`)}` })

            return false
        }

        await mention.disableCommunicationUntil(null, reason).catch(() => {})
    } else {
        const mute_role = message.guild.roles.cache.get(server.moderation.roles.mute)
        const tempmute = self.tempmutes.find(m => m.user_id == mention.id)

        if (!mute_role?.members?.has(mention.id)) {
            await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_muted, `**${message.member.displayName}**`)}` })

            return false
        }

        if (!mute_role.editable) {
            await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.cant_remove_role, `**${message.member.displayName}**`)}` })

            return false
        }

        if (tempmute) await tempmute.delete(false)
        else {
            const returnable_roles = server.moderation.roles.on_mute.returnable_roles.find(r => r.user_id == mention.id)

            if (returnable_roles) {
                await self.db.servers.updateOne(
                    { _id: message.guild.id },
                    {
                        $pull: {
                            'moderation.roles.on_mute.returnable_roles': {
                                user_id: mention.id
                            }
                        }
                    }
                )

                await mention.roles.add(returnable_roles.roles.filter(r => mention.guild.roles.cache.has(r)))
            }

            await mention.roles.remove(mute_role.id, reason).catch(self.logger.error)

            if (mention.voice?.serverMute) await mention.voice.setMute(false, reason).catch(self.logger.error)
        }
    }

    await caseLog.createCaseEntry(server, message.guild, { type: 'MUTE_REMOVE', target: mention.user, executor: message.author, reason })

    await message.reply({
        content: `${self._emojis.OK} | ${self.translator.format(locale.unmute.texts.user_unmuted, `**${message.member.displayName}**`, `**${mention.user.tag}**`)}`
    })

    return true
}
