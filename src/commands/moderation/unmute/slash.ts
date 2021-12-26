import { BaseGuildTextChannel, CommandInteraction, GuildMember, MessageEmbed } from 'discord.js'
import { ServerDocument } from '../../../database/schemas/Servers'
import Lacuna from '../../../internals/Lacuna'
import { images } from '../../../modules/Logs'

export default async (self: Lacuna, server: ServerDocument, interaction: CommandInteraction) => {
    const locale = self.translator.locale(server.locale).commands

    const mention = interaction.options?.getMember('пользователь') as GuildMember
    const reason = interaction.options?.getString('причина') ?? '-'

    if (!mention) {
        await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_found, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })

        return false
    }

    const case_log = interaction.guild.channels.cache.get(server.moderation.case_log.channel_id) as BaseGuildTextChannel
    const case_id: number = server.moderation.case_log.cases.length + 1

    if (server.moderation.use_timeout_mute) {
        if (!mention.communicationDisabledUntilTimestamp) {
            await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_muted, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
    
            return false
        }

        await mention.disableCommunicationUntil(null, reason).catch(() => {})
    }

    else {
        const mute_role = interaction.guild.roles.cache.get(server.moderation.roles.mute)
        const tempmute = self.tempmutes.find(m => m.user_id == mention.id)
    
        if (!mute_role?.members?.has(mention.id)) {
            await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.user_not_muted, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
    
            return false
        }
    
        if (!mute_role.editable) {
            await interaction.reply({ content: `${self._emojis.ERROR} | ${self.translator.format(locale.unmute.texts.cant_remove_role, `**${(interaction.member as any).displayName}**`)}`, ephemeral: true })
    
            return false
        }

        if (tempmute) await tempmute.delete(false)
        else {
            const returnable_roles = server.moderation.roles.on_mute.returnable_roles.find(r => r.user_id == mention.id)
    
            if (returnable_roles) {
                await self.db.servers.updateOne({ _id: interaction.guild.id }, {
                    $pull: {
                        'moderation.roles.on_mute.returnable_roles': {
                            user_id: mention.id
                        }
                    }
                })
    
                await mention.roles.add(returnable_roles.roles.filter(r => mention.guild.roles.cache.has(r)))
            }
    
            await mention.roles.remove(mute_role.id, reason).catch(self.logger.error)
    
            if (mention.voice?.serverMute) await mention.voice.setMute(false, reason).catch(self.logger.error)
        }
    }

    const case_log_message = new MessageEmbed()
        .setAuthor({ name: locale.common.case_log.cases.MUTE_REMOVE, iconURL: images.MUTE_REMOVE })
        .addField(locale.common.case_log.target, `${mention.user.tag}\n(${mention.id})`, true)
        .addField(locale.common.case_log.executor, interaction.user.tag, true)
        .addField(locale.common.case_log.reason, reason)
        .setFooter(self.translator.format(locale.common.case_log.case, case_id))
        .setTimestamp()
        .setColor('#2FDF84')

    if (case_log && server.moderation.case_log.case_types.MUTE_REMOVE) {
        await case_log.send({ embeds: [case_log_message] }).catch(self.logger.error)
    
        await self.db.servers.updateOne({ _id: interaction.guild.id }, {
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
                        id: interaction.user.id,
                        name: interaction.user.tag
                    }
                }
            }
        })
    }

    await interaction.reply({ content: `${self._emojis.OK} | ${self.translator.format(locale.unmute.texts.user_unmuted, `**${(interaction.member as any).displayName}**`, `**${mention.user.tag}**`)}`, ephemeral: true })

    return true
}