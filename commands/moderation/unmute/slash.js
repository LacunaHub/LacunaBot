const { MessageEmbed } = require('discord.js')
const { images } = require('../../../modules/Logs')

/**
 * @param {import('../../../internals/Lacuna')} self
 * @param {import('../../../internals/Typings').ServerDocument} server
 * @param {import('discord.js').CommandInteraction} interaction
 */
module.exports = async (self, server, interaction) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь')
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_found, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id)
    const case_id = server.moderation.case_log.cases.length + 1

    const mute_role = interaction.guild.roles.cache.get(server.moderation.roles.mute)
    const tempmute = self.tempmutes.find(m => m.user_id == mention.id)

    if (!mute_role?.members?.has(mention.id)) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_muted, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    if (!mute_role.editable) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.cant_remove_role, `**${interaction.member.displayName}**`)}`, ephemeral: true })

        return false
    }

    const case_log_message = new MessageEmbed()
        .setAuthor(locale.common.case_log.cases.MUTE_REMOVE, images.MUTE_REMOVE)
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, interaction.member.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#2FDF84')

    if (tempmute) await tempmute.delete(false)
    else {
        const returnable_roles = server.moderation.roles.on_mute.returnable_roles.find(r => r.user_id == mention.id)

        if (returnable_roles) {
            await self.db.servers.update({ _id: interaction.guild.id }, {
                $pull: {
                    'moderation.roles.on_mute.returnable_roles': {
                        user_id: mention.id
                    }
                }
            })

            await mention.roles.add(returnable_roles.roles.filter(r => mention.guild.roles.cache.has(r)))
        }

        await mention.roles.remove(mute_role.id, reason).catch(self.logger.error)
    }

    if (case_log && server.moderation.case_log.case_types.MUTE_REMOVE) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.update({ _id: interaction.guild.id }, {
            $push: {
                'moderation.case_log.cases': {
                    case_id: case_id,
                    type: 1 << 4,
                    timestamp: Date.now(),
                    reason: reason,
                    target: {
                        id: mention.id,
                        name: mention.user.tag
                    },
                    executor: {
                        id: interaction.member.id,
                        name: interaction.member.user.tag
                    }
                }
            }
        })
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.unmute.texts.user_unmuted, `**${interaction.member.displayName}**`, `**${mention.user.tag}**`)}`, ephemeral: true })

    return true
}