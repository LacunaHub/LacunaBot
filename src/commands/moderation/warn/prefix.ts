import { Message } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'
import { addWarn } from '../../../modules/Warnings'

export async function addPrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? await message.guild.members.fetch(message['args'][0]) : null)
    const reason = message['args'].slice(1).join(' ') || '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.add.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    if (mention.id == message.member.id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.self_action, `**${message.member.displayName}**`)}` })

        return false
    }

    await addWarn(self, server, message, { target: mention, executor: message.member, reason: reason })

    await message.reply({
        content: `${self._emojis.OK} | ${self.translator.format(locale.warn.add.texts.user_warned, `**${message.member.displayName}**`, `**${mention.user.tag}**`)}`
    })

    return true
}

export async function removePrefix(self: Lacuna, server: ServerDocument, message: Message) {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? await message.guild.members.fetch(message['args'][0]) : null)
    const warn_id = message['args'][1]
    const reason = message['args'].slice(2).join(' ') || '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.add.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!warn_id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_warn_id, `**${message.member.displayName}**`)}` })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == mention.id)

    if (!violator || !violator.violations.length) {
        await message.reply({
            content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_violator_or_violations, `**${message.member.displayName}**`)}`
        })

        return false
    }

    if (warn_id === 'all') {
        await self.db.servers.updateOne(
            { _id: message.guild.id },
            {
                $pull: {
                    'moderation.warnings.violators': {
                        user_id: mention.id
                    }
                }
            }
        )

        await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.warn.remove.texts.warns_removed_all, `**${message.member.displayName}**`)}` })
    } else {
        const violation = violator.violations.find((v, i) => v.id == warn_id || i + 1 == warn_id)

        if (!violation) {
            await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.invalid_warn_id, `**${message.member.displayName}**`)}` })

            return false
        }

        await self.db.servers.updateOne(
            { _id: message.guild.id, 'moderation.warnings.violators.user_id': mention.id },
            {
                $pull: {
                    'moderation.warnings.violators.$.violations': {
                        id: violation.id
                    }
                }
            }
        )

        await message.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.warn.remove.texts.warn_removed, `**${message.member.displayName}**`)}` })
    }

    await caseLog.createCaseEntry(server, message.guild, { type: 'WARN_REMOVE', target: mention.user, executor: message.author, reason })

    return true
}

export default { addPrefix, removePrefix }
