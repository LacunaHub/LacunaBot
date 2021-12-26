import { BaseGuildTextChannel, CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { images } from '../../../modules/Logs'
import { addWarn } from '../../../modules/Warnings'

export async function addSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.add.texts.user_not_found, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (mention.id == interaction.user.id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.ban.texts.self_action, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    await addWarn(self, server, interaction, { target: mention, executor: interaction.member as GuildMember, reason: reason })

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.warn.add.texts.user_warned, `**${(interaction.member as any).displayName}**`, `**${mention.user.tag}**`)}`, ephemeral: true })

    return true
}

export async function removeSlash(self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const warn_id = interaction.options?.getString('номер-предупреждения') as string | number
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.add.texts.user_not_found, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!warn_id) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_warn_id, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const violator = server.moderation.warnings.violators.find(v => v.user_id == mention.id)

    if (!violator || !violator.violations.length) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.no_violator_or_violations, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    if (warn_id === 'all') {
        await self.db.servers.updateOne({ _id: interaction.guild.id }, {
            $pull: {
                'moderation.warnings.violators': {
                    user_id: mention.id
                }
            }
        })

        await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.warn.remove.texts.warns_removed_all, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
    }

    else {
        const violation = violator.violations.find((v, i) => v.id == warn_id || (i + 1) == warn_id)

        if (!violation) {
            await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.warn.remove.texts.invalid_warn_id, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
    
            return false
        }
    
        await self.db.servers.updateOne({ _id: interaction.guild.id, 'moderation.warnings.violators.user_id': mention.id }, {
            $pull: {
                'moderation.warnings.violators.$.violations': {
                    id: violation.id
                }
            }
        })

        await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.warn.remove.texts.warn_removed, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    const case_id: number = server.moderation.case_log.cases.length + 1

    const case_log_message = new MessageEmbed()
        .setAuthor({ name: locale.common.case_log.cases.WARN_REMOVE, iconURL: images.WARN_REMOVE })
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, interaction.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#2FDF84')

    if (case_log && server.moderation.case_log.case_types.WARN_REMOVE) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.updateOne({ _id: interaction.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 9,
                    timestamp: Date.now(),
                    reason: reason,
                    target: {
                        id: mention.id,
                        name: mention.user.tag
                    },
                    executor: {
                        id: interaction.user.id,
                        name: interaction.user.tag
                    }
                }
            }
        })
    }

    return true
}

export default { addSlash, removeSlash }