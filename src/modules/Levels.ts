import Canvas, { CanvasRenderingContext2D, Image } from 'canvas'
import {
    AttachmentBuilder,
    BaseGuildTextChannel,
    BaseGuildVoiceChannel,
    ChatInputCommandInteraction,
    Collection,
    ContextMenuCommandInteraction,
    GuildMember,
    Message,
    Role,
    VoiceState
} from 'discord.js'
import numbro from 'numbro'
import { LevelAward, ServerDocument } from '../database/schemas/Servers'
import { IUserLevel } from '../database/schemas/Users'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

export function hasRestrictedPermissions(options: IHasRestrictedPermissionsOptions) {
    const { channel, roles, allowedChannels, allowedRoles, blockedChannels, blockedRoles } = options

    if (blockedRoles.length) {
        const isBlockedRole = roles.some(i => blockedRoles.includes(i.id))

        if (isBlockedRole) return true
    }

    if (allowedRoles.length) {
        const isNotAllowedRole = !roles.some(i => allowedRoles.includes(i.id))

        if (isNotAllowedRole) return true
    }

    if (blockedChannels.length) {
        const isBlockedChannel = blockedChannels.includes(channel.id),
            isBlockedChannelParent = channel.parentId && blockedChannels.includes(channel.parentId)

        if (isBlockedChannel || isBlockedChannelParent) return true
    }

    if (allowedChannels.length) {
        const isAllowedChannel = allowedChannels.includes(channel.id),
            isAllowedChannelParent = channel.parentId && allowedChannels.includes(channel.parentId)

        if (isAllowedChannel) return false
        if (isAllowedChannelParent) return false

        return true
    }

    return false
}

export async function onMessageCreate(self: Lacuna, server: ServerDocument, message: Message): Promise<boolean> {
    const { levels, activities } = server.modules

    if (!levels.active) return false

    const hasRestrictions = hasRestrictedPermissions({
        channel: message.channel as any,
        roles: message.member.roles.cache,
        allowedChannels: levels.allowed.channels,
        allowedRoles: levels.allowed.roles,
        blockedChannels: levels.blocked.channels,
        blockedRoles: levels.blocked.roles
    })

    if (hasRestrictions) return false

    let user = await self.db.users.findOne({ _id: message.author.id })

    if (!user) {
        user = await self.db.users.create({
            _id: message.author.id,
            user: {
                username: message.author.username,
                discriminator: message.author.discriminator,
                avatar: message.author.avatar,
                flags: message.author.flags?.bitfield ?? 0
            }
        } as any)
    }

    let userLevel = user.activities.levels.find(i => i.guild_id === message.guildId)

    if (!userLevel) {
        userLevel = {
            guild_id: message.guildId,
            experience: { total: 0, current: 0, level: 0 },
            activity: {
                total_messages: 0,
                last_message_at: null,
                total_voice_time: 0,
                voice_connected_at: null
            }
        }

        await self.db.users.updateOne(
            { _id: message.author.id },
            {
                $push: { 'activities.levels': userLevel as never }
            }
        )
    }

    if (Date.now() - userLevel.activity.last_message_at < 60000) return false

    const currentXp: number = userLevel.experience.current
    const currentLevel: number = userLevel.experience.level,
        nextLevel = 150 + currentLevel * currentLevel * 8

    const multipliers = activities.multipliers
        .filter(i => {
            const hasRestrictions = hasRestrictedPermissions({
                channel: message.channel as any,
                roles: message.member.roles.cache,
                allowedChannels: i.allowed_channels,
                allowedRoles: i.allowed_roles,
                blockedChannels: i.blocked_channels,
                blockedRoles: i.blocked_roles
            })

            if (hasRestrictions) return false

            return i.options.includes('LEVELS_TEXT')
        })
        .slice(0, server.server.premium.available ? 10 : 1)

    const multiplier = multipliers.reduce((x, y) => x * (y.levels_text_multiplier / 100), 100) / 100
    let points: number = Math.floor(Math.random() * 11) + 15 + currentLevel

    points *= multiplier || 1

    if (nextLevel - currentXp <= points) {
        userLevel.activity.last_message_at = Date.now()
        userLevel.activity.total_messages++
        userLevel.experience.level++
        userLevel.experience.current = 0
        userLevel.experience.total += nextLevel - currentXp

        await self.db.users.updateOne(
            { _id: message.author.id, 'activities.levels.guild_id': message.guildId },
            {
                $set: {
                    'activities.levels.$.activity.last_message_at': userLevel.activity.last_message_at,
                    'activities.levels.$.activity.total_messages': userLevel.activity.total_messages,
                    'activities.levels.$.experience.level': userLevel.experience.level,
                    'activities.levels.$.experience.current': userLevel.experience.current,
                    'activities.levels.$.experience.total': userLevel.experience.total
                }
            }
        )

        await sendLevelUpAlert(self, server, message, message.member)
    } else {
        userLevel.activity.last_message_at = Date.now()
        userLevel.activity.total_messages++
        userLevel.experience.current += points
        userLevel.experience.total += points

        await self.db.users.updateOne(
            { _id: message.author.id, 'activities.levels.guild_id': message.guildId },
            {
                $set: {
                    'activities.levels.$.activity.last_message_at': userLevel.activity.last_message_at,
                    'activities.levels.$.activity.total_messages': userLevel.activity.total_messages,
                    'activities.levels.$.experience.current': userLevel.experience.current,
                    'activities.levels.$.experience.total': userLevel.experience.total
                }
            }
        )
    }

    await updateAwards(self, server, message.member, userLevel)

    self.emit('moduleExecution', {
        module: 'Levels',
        category: 'MessageCreate',
        guild: { id: message.guild.id, name: message.guild.name },
        target: { id: message.author.id, name: message.author.tag }
    })

    return true
}

export async function onVoiceConnect(self: Lacuna, server: ServerDocument, state: VoiceState): Promise<boolean> {
    const { levels } = server.modules

    if (!levels.voice) return false
    if (state.guild.afkChannelId === state.channelId) return false

    const activeVoiceStates = state.guild.voiceStates.cache.filter(i => !i.member.user.bot && i.channelId).size

    if (activeVoiceStates >= 15 && !server.server.premium.available) return false

    const members = state.channel.members.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

    if (members.size < 2) return false

    for (const [_, member] of members) {
        const hasRestrictions = hasRestrictedPermissions({
            channel: state.channel,
            roles: member.roles.cache,
            allowedChannels: levels.allowed.channels,
            allowedRoles: levels.allowed.roles,
            blockedChannels: levels.blocked.channels,
            blockedRoles: levels.blocked.roles
        })

        if (hasRestrictions) continue

        let user = await self.db.users.findOne({ _id: member.id })

        if (!user) {
            user = await self.db.users.create({
                _id: member.id,
                user: {
                    username: member.user.username,
                    discriminator: member.user.discriminator,
                    avatar: member.user.avatar,
                    flags: member.user.flags?.bitfield ?? 0
                }
            } as any)
        }

        let userLevel = user.activities.levels.find(i => i.guild_id === server._id)

        if (!userLevel) {
            userLevel = {
                guild_id: server._id,
                experience: { total: 0, current: 0, level: 0 },
                activity: {
                    total_messages: 0,
                    last_message_at: null,
                    total_voice_time: 0,
                    voice_connected_at: null
                }
            }

            await self.db.users.updateOne(
                { _id: member.id },
                {
                    $push: { 'activities.levels': userLevel as never }
                }
            )
        }

        if (!userLevel.activity.voice_connected_at || Date.now() - userLevel.activity.voice_connected_at > 1000 * 60 * 60 * 10) {
            await self.db.users.updateOne(
                { _id: member.id, 'activities.levels.guild_id': server._id },
                {
                    $set: {
                        'activities.levels.$.activity.voice_connected_at': Date.now()
                    }
                }
            )
        }
    }

    self.emit('moduleExecution', {
        module: 'Levels',
        category: 'VoiceConnect',
        guild: { id: state.member.guild.id, name: state.member.guild.name },
        target: { id: state.member.id, name: state.member.user.tag }
    })

    return true
}

export async function onVoiceDisconnect(self: Lacuna, server: ServerDocument, state: VoiceState, channel: BaseGuildVoiceChannel) {
    if (!server.modules.levels.voice) return false

    const members = channel?.members?.filter?.(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

    if (members) {
        const targetMembers = members.size === 1 ? [state.member, members.first()] : [state.member]

        for (const member of targetMembers) {
            const user = await self.db.users.findOne({ _id: member.user.id }),
                userLevel = user?.activities?.levels?.find(i => i.guild_id === server._id)

            if (!userLevel?.activity?.voice_connected_at || Date.now() - userLevel.activity.voice_connected_at > 1000 * 60 * 60 * 10) continue

            const currentXp: number = userLevel.experience.current
            const currentLevel: number = userLevel.experience.level,
                nextLevel: number = 150 + currentLevel * currentLevel * 8

            const multipliers = server.modules.activities.multipliers
                .filter(i => {
                    const hasRestrictions = hasRestrictedPermissions({
                        channel: channel,
                        roles: member.roles.cache,
                        allowedChannels: i.allowed_channels,
                        allowedRoles: i.allowed_roles,
                        blockedChannels: i.blocked_channels,
                        blockedRoles: i.blocked_roles
                    })

                    if (hasRestrictions) return false

                    return i.options.includes('LEVELS_VOICE')
                })
                .slice(0, server.server.premium.available ? 10 : 1)

            const multiplier = multipliers.reduce((x, y) => x * (y.levels_voice_multiplier / 100), 100) / 100
            const time: number = (Date.now() - userLevel.activity.voice_connected_at) / 1000
            let points: number =
                ((time / 60) * (time / 60 / 60 <= 0 ? 1 : time / 60 / 60) + (5 / 100) * time) *
                ((10 / 100) * currentLevel < 1 ? 1 : (10 / 100) * currentLevel)

            points *= multiplier || 1

            if (nextLevel - currentXp <= points) {
                let newLevel: number, newCurrentXp: number

                for (
                    newLevel = currentLevel, newCurrentXp = points + currentXp;
                    newCurrentXp >= neededXp(newLevel);
                    newCurrentXp -= neededXp(newLevel), newLevel++
                ) {}

                userLevel.activity.total_voice_time += +time.toFixed(2)
                userLevel.activity.voice_connected_at = null
                userLevel.experience.current = +newCurrentXp.toFixed(2)
                userLevel.experience.level = newLevel
                userLevel.experience.total = +(neededTotalXp(newLevel) + newCurrentXp).toFixed(2)

                await self.db.users.updateOne(
                    { _id: member.id, 'activities.levels.guild_id': server._id },
                    {
                        $set: {
                            'activities.levels.$.activity.total_voice_time': userLevel.activity.total_voice_time,
                            'activities.levels.$.activity.voice_connected_at': userLevel.activity.voice_connected_at,
                            'activities.levels.$.experience.current': userLevel.experience.current,
                            'activities.levels.$.experience.level': userLevel.experience.level,
                            'activities.levels.$.experience.total': userLevel.experience.total
                        }
                    }
                )

                await sendLevelUpAlert(self, server, state, member)
            } else {
                userLevel.activity.total_voice_time += +time.toFixed(2)
                userLevel.activity.voice_connected_at = null
                userLevel.experience.current += +points.toFixed(2)
                userLevel.experience.total += +points.toFixed(2)

                await self.db.users.updateOne(
                    { _id: member.id, 'activities.levels.guild_id': server._id },
                    {
                        $set: {
                            'activities.levels.$.activity.total_voice_time': userLevel.activity.total_voice_time,
                            'activities.levels.$.activity.voice_connected_at': userLevel.activity.voice_connected_at,
                            'activities.levels.$.experience.current': userLevel.experience.current,
                            'activities.levels.$.experience.total': userLevel.experience.total
                        }
                    }
                )
            }

            await updateAwards(self, server, member, userLevel)

            self.emit('moduleExecution', {
                module: 'Levels',
                category: 'VoiceDisconnect',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })
        }
    }
}

export async function updateAwards(self: Lacuna, server: ServerDocument, member: GuildMember, userLevel: IUserLevel, award?: LevelAward) {
    let conditionsMet = false,
        isAwardReceived = false

    const awards = server.modules.levels.awards.slice(0, server.server.premium.available ? 200 : 50).sort((a, b) => {
        const aValues = a.conditions ? Object.values(a.conditions) : [a.level, 0, 0],
            bValues = b.conditions ? Object.values(b.conditions) : [b.level, 0, 0]

        return aValues.some((v, i) => v > bValues[i]) ? -1 : 1
    })

    if (award) {
        conditionsMet = award.conditions
            ? userLevel.experience.level >= award.conditions.level &&
              userLevel.activity.total_voice_time >= award.conditions.voice_time &&
              userLevel.activity.total_messages >= award.conditions.sent_messages
            : userLevel.experience.level === award.level
    } else {
        award = awards.find(v => {
            return v.conditions
                ? userLevel.experience.level >= v.conditions.level &&
                      userLevel.activity.total_voice_time >= v.conditions.voice_time &&
                      userLevel.activity.total_messages >= v.conditions.sent_messages
                : userLevel.experience.level === v.level
        })

        conditionsMet = !!award
        isAwardReceived = userLevel.received_awards?.includes?.(award.id)
    }

    if (conditionsMet) {
        if (isAwardReceived) return null

        try {
            const rolesToAdd = award.references.filter(v => !member.roles.cache.has(v)),
                rolesToRemove = award.remove_references?.filter?.(v => member.roles.cache.has(v)) ?? []

            if (rolesToAdd.length) {
                await member.roles.add(rolesToAdd)
            }

            if (rolesToRemove.length) {
                await member.roles.remove(rolesToRemove)
            }

            if (!userLevel.received_awards?.includes?.(award.id)) {
                await self.db.users.updateOne(
                    { _id: member.id, 'activities.levels.guild_id': server._id },
                    {
                        $push: {
                            'activities.levels.$.received_awards': award.id
                        }
                    }
                )
            }

            if (award.alert.active) {
                try {
                    const replacer = new Replacer({ guild: member.guild, member: member }),
                        messagePayload = await replacer.replaceTemplateMessage(award.alert.message)

                    if (award.alert.format === 'DM') {
                        await member.send(messagePayload)
                    }

                    if (award.alert.format === 'CHANNEL') {
                        const channel = member.guild.channels.cache.get(award.alert.channel_id) as BaseGuildTextChannel

                        if (channel) {
                            await channel.send(messagePayload)
                        }
                    }
                } catch (err) {
                    await self.logger.handleError({ module: 'Levels', action: 'SendAwardMessage', error: err, guild_id: server._id })
                }
            }

            self.emit('moduleExecution', {
                module: 'Levels',
                category: 'AssignAward',
                guild: { id: member.guild.id, name: member.guild.name },
                target: { id: member.id, name: member.user.tag }
            })
        } catch (err) {
            await self.logger.handleError({ module: 'Levels', action: 'AssignAward', error: err, guild_id: server._id })
        }
    }

    return award
}

export async function sendLevelUpAlert(self: Lacuna, server: ServerDocument, signal: Message | VoiceState, member: GuildMember) {
    const alert = server.modules.levels.level_up_alerts

    if (alert.active) {
        const replacer = new Replacer({ guild: signal.guild, member: member }),
            messagePayload = await replacer.replaceTemplateMessage(alert.message)

        try {
            if (alert.format === 'CURRENT_CHANNEL') {
                await signal.channel.send(messagePayload)
            }

            if (alert.format === 'DM') {
                await member.send(messagePayload)
            }

            if (alert.format === 'CHANNEL') {
                const channel = signal.guild.channels.cache.get(alert.channel_id) as BaseGuildTextChannel

                if (channel) {
                    await channel.send(messagePayload)
                }
            }
        } catch (err) {
            await self.logger.handleError({ module: 'Levels', action: 'SendLevelUpMessage', error: err, guild_id: server._id })
        }

        self.emit('moduleExecution', {
            module: 'Levels',
            category: 'LevelUpAlert',
            guild: { id: signal.guild.id, name: signal.guild.name },
            target: { id: member.id, name: member.user.tag }
        })
    }
}

export async function generateRankCard(
    self: Lacuna,
    signal: ChatInputCommandInteraction | ContextMenuCommandInteraction
): Promise<AttachmentBuilder> {
    let mention: GuildMember

    if (signal instanceof ChatInputCommandInteraction) mention = (signal.options?.getMember('user') || signal.member) as GuildMember
    if (signal instanceof ContextMenuCommandInteraction) mention = await signal.guild.members.fetch(signal.targetId)

    const activities = (await self.db.users.find({ 'activities.levels.guild_id': signal.guildId })).map(i => ({
        user_id: i._id,
        ...i.activities.levels.find(i => i.guild_id == signal.guildId)
    }))

    const sorted = activities.sort((a, b) => b.experience.total - a.experience.total)
    let level = sorted.find(i => i.user_id == mention.id)

    if (!level) {
        level = {
            guild_id: signal.guildId,
            experience: { total: 0, current: 0, level: 0 },
            activity: {
                total_messages: 0,
                last_message_at: null,
                total_voice_time: 0,
                voice_connected_at: null
            },
            user_id: mention.id
        }
    }

    await mention.user?.fetch()

    const canvas = await Canvas.createCanvas(720, 256)
    const ctx = canvas.getContext('2d')

    ctx.save()

    let banner: Image

    try {
        if (mention.user?.banner) banner = await Canvas.loadImage(mention.user?.bannerURL({ extension: 'png', size: 512 }))
    } catch (err) {
        banner = null
    }

    const rect_x = canvas.width,
        rect_y = canvas.height,
        border_radius = 40

    ctx.fillStyle = '#16151A'
    ctx.strokeStyle = '#16151A'
    ctx.fillRect(rect_x, rect_y, rect_x, rect_y)
    ctx.lineJoin = 'round'
    ctx.lineWidth = border_radius

    ctx.strokeRect(border_radius / 2, border_radius / 2, rect_x - border_radius, rect_y - border_radius)
    ctx.fillRect(border_radius / 2, border_radius / 2, rect_x - border_radius, rect_y - border_radius)

    if (banner) {
        const width_ratio = 720 / banner.width,
            height_ratio = 256 / banner.height
        const ratio = width_ratio > height_ratio ? width_ratio : height_ratio

        ctx.save()
        roundImage(ctx, 0, 0, 720, 256, border_radius / 2)
        ctx.clip()
        ctx.globalAlpha = 0.2
        ctx.drawImage(
            banner,
            rect_x / 2 - (banner.width * ratio) / 2,
            rect_y / 2 - (banner.height * ratio) / 2,
            banner.width * ratio,
            banner.height * ratio
        )
        ctx.globalAlpha = 1.0
        ctx.restore()
    }

    const avatar = await Canvas.loadImage(mention.user.displayAvatarURL({ extension: 'png' }))

    ctx.beginPath()
    ctx.arc(85, 85, 60, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.clip()

    ctx.drawImage(avatar, 25, 25, 120, 120)
    ctx.restore()

    const color = mention.user?.hexAccentColor ?? '#b86eab'

    ctx.globalAlpha = 0.5
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.lineWidth = 20
    ctx.moveTo(35, 185)
    ctx.lineTo(685, 185)
    ctx.stroke()
    ctx.restore()
    ctx.globalAlpha = 1.0

    const formula = 150 + level.experience.level * level.experience.level * 8
    const percent = Math.floor((level.experience.current * 100) / formula)
    const progress = Math.floor((650 * percent) / 100)

    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.lineWidth = 20
    ctx.moveTo(35, 185)
    ctx.lineTo(35 + progress, 185)
    ctx.stroke()

    ctx.font = '25px Gotham Pro Medium'
    ctx.fillStyle = '#ffffff'
    const username = mention.displayName
    const measure = ctx.measureText(username)
    ctx.fillText(measure.width > 450 ? 'Username' : username, 160, 70, 450)

    // ctx.fillStyle = '#545B5F'
    // ctx.fillText(`#${mention.user.discriminator}`, measure.width > 400 ? 160 + ctx.measureText('Username').width : 160 + measure.width, 70)

    ctx.strokeStyle = '#545B5F'
    ctx.beginPath()
    ctx.lineCap = 'round'
    ctx.lineWidth = 1
    ctx.moveTo(160, 85)
    ctx.lineTo(695, 85)
    ctx.stroke()

    const messages = await Canvas.loadImage('./assets/messages.png')
    const microphone = await Canvas.loadImage('./assets/microphone.png')

    ctx.font = '25px Gotham Pro Medium'
    ctx.fillStyle = '#ffffff'

    ctx.textAlign = 'end'
    const index = sorted.indexOf(level)
    const m2 = ctx.measureText(`#${index == -1 ? '-' : index + 1}`)
    ctx.fillText(`#${index == -1 ? '-' : index + 1}`, 695, 70)
    ctx.font = '20px Gotham Pro Medium'
    ctx.fillStyle = '#545B5F'
    ctx.fillText('TOP', 690 - m2.width, 70)
    //ctx.drawImage(place, (690 - 25) - m2.width, 48, 25, 25)

    ctx.textAlign = 'start'
    const m4 = ctx.measureText('LV.')
    ctx.fillText('LV.', 160, 117)
    ctx.font = '25px Gotham Pro Medium'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`${level.experience.level}`, 165 + m4.width, 117)
    //ctx.drawImage(lvl, 160, 95, 25, 25)

    ctx.font = '22px Gotham Pro Medium'
    ctx.fillStyle = '#545B5F'
    ctx.textAlign = 'end'
    const m3 = ctx.measureText(`${level.activity.total_messages}`)
    ctx.fillText(`${level.activity.total_messages}`, 695, 117)
    ctx.drawImage(messages, 690 - 25 - m3.width, 95, 25, 25)

    const voice_time = numbro(level.activity.total_voice_time).format({ output: 'time' })
    const m5 = ctx.measureText(voice_time)
    ctx.fillText(voice_time, 620 - m3.width / 2, 117)
    ctx.drawImage(microphone, 615 - m3.width / 2 - 25 - m5.width, 95, 25, 25)

    const current_xp_format =
        level.experience.current >= 1000
            ? numbro(Math.floor(level.experience.current)).format({ average: true, mantissa: 2 }).toUpperCase()
            : Math.floor(level.experience.current)
    const next_xp_format = formula >= 1000 ? numbro(formula).format({ average: true, mantissa: 2 }).toUpperCase() : formula

    ctx.textBaseline = 'top'
    ctx.font = '20px Gotham Pro Medium'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'start'
    ctx.fillText(`${current_xp_format}`, 25, 205)

    ctx.textAlign = 'end'
    ctx.fillText(`${next_xp_format}`, 695, 205)

    return new AttachmentBuilder(canvas.toBuffer(), { name: `lacuna-rank-${Date.now()}.png` })
}

function neededXp(level: number): number {
    return 150 + level * level * 8
}
function neededTotalXp(level: number): number {
    let total = 0

    for (let i = 0; i < level; i++) {
        total += 150 + i * i * 8
    }

    return total
}

function roundImage(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}

export default {
    onMessageCreate,
    onVoiceConnect,
    onVoiceDisconnect,
    updateAwards,
    sendLevelUpAlert,
    generateRankCard
}

export interface IHasRestrictedPermissionsOptions {
    channel: BaseGuildTextChannel | BaseGuildVoiceChannel
    roles: Collection<string, Role>
    allowedChannels: string[]
    allowedRoles: string[]
    blockedChannels: string[]
    blockedRoles: string[]
}
