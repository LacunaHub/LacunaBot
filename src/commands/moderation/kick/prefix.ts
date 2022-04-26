import { Message } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { caseLog } from '../../../modules/Moderation'
import Replacer from '../../../modules/Replacer'

export default async (self: Lacuna, server: ServerDocument, message: Message) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = message.mentions.members.first() || (message['args'][0] ? await message.guild.members.fetch(message['args'][0]) : null)
    const reason = message['args'].slice(1).join(' ') || '-'

    if (!mention) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.user_not_found, `**${message.member.displayName}**`)}` })

        return false
    }

    if (!mention.kickable) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.kick.texts.cant_kick_user, `**${message.member.displayName}**`)}` })

        return false
    }

    if (mention.id == message.member.id) {
        await message.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.self_action, `**${message.member.displayName}**`)}` })

        return false
    }

    if (server.moderation.case_log.case_types_messages.KICK.active) {
        const replacer = new Replacer(null, { guild: message.guild, member: mention, message, penalty: { reason } })
        const dm_message = await replacer.replaceTemplateMessage(server.moderation.case_log.case_types_messages.KICK.dm_message)

        await mention.send(dm_message).catch(self.logger.error)
    }

    await mention.kick(reason).catch(self.logger.error)
    await caseLog.createCaseEntry(server, message.guild, { type: 'KICK', target: mention.user, executor: message.author, reason })

    await message.reply({
        content: `${self._emojis.OK} | ${self.translator.format(locale.kick.texts.user_kicked, `**${message.member.displayName}**`, `**${mention.user.tag}**`)}`
    })

    return true
}
