import Canvas, { CanvasRenderingContext2D, Image } from 'canvas'
import {
    AttachmentBuilder,
    BaseGuildTextChannel,
    BaseGuildVoiceChannel,
    ChatInputCommandInteraction,
    ContextMenuCommandInteraction,
    GuildMember,
    Message,
    VoiceState
} from 'discord.js'
import numbro from 'numbro'
import { ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import Replacer from './Replacer'

export async function messageCreate(self: Lacuna, server: ServerDocument, message: Message): Promise<boolean> {
    const { levels, activities } = server.modules

    if (!levels.active) return false

    const isBlockedChannel = levels.blocked.channels.includes(message.channel.id),
        isBlockedChannelParent = levels.blocked.channels.includes((message.channel as BaseGuildTextChannel).parentId),
        isBlockedRole = message.member.roles.cache.some(r => levels.blocked.roles.includes(r.id))
    const isNotAllowedChannel = levels.allowed.channels.length && !levels.allowed.channels.includes(message.channel.id),
        isNotAllowedChannelParent =
            levels.allowed.channels.length && !levels.allowed.channels.includes((message.channel as BaseGuildTextChannel).parentId),
        isNotAllowedRole = levels.allowed.roles.length && !message.member.roles.cache.some(r => levels.allowed.roles.includes(r.id))

    if (isBlockedChannel || isBlockedChannelParent || isBlockedRole) return false
    if (isNotAllowedChannel) return false
    if (isNotAllowedRole) return false

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

    let level = user.activities.levels.find(i => i.guild_id == message.guildId)

    if (!level) {
        level = {
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
                $push: { 'activities.levels': level as never }
            }
        )
    }

    if (Date.now() - level.activity.last_message_at < 60000) return false

    const current_xp: number = level.experience.current,
        total_xp = level.experience.total
    const current_level: number = level.experience.level,
        next_level = 150 + current_level * current_level * 8

    const multipliers = activities.multipliers
        .filter(i => {
            if (i.blocked_channels.includes(message.channelId)) return false
            if (message.member.roles.cache.some(ii => i.blocked_roles.includes(ii.id))) return false
            if (i.allowed_channels.length && !i.allowed_channels.includes(message.channelId)) return false
            if (i.allowed_roles.length && !message.member.roles.cache.some(ii => i.allowed_roles.includes(ii.id))) return false

            return i.options.includes('LEVELS_TEXT')
        })
        .slice(0, server.server.premium.available ? 10 : 1)

    const multiplier = multipliers.reduce((x, y) => x * (y.levels_text_multiplier / 100), 100) / 100
    let points: number = Math.floor(Math.random() * 11) + 15 + current_level

    points *= multiplier || 1

    if (next_level - current_xp <= points) {
        await self.db.users.updateOne(
            { _id: message.author.id, 'activities.levels.guild_id': message.guildId },
            {
                $set: {
                    'activities.levels.$.experience.level': current_level + 1,
                    'activities.levels.$.experience.current': 0,
                    'activities.levels.$.experience.total': total_xp + (next_level - current_xp),
                    'activities.levels.$.activity.last_message_at': Date.now()
                },
                $inc: {
                    'activities.levels.$.activity.total_messages': 1
                }
            }
        )

        await updateAwards(self, server, { member: message.member, level: current_level + 1 })
        await sendLevelUpAlert(self, server, { message: message, level: current_level + 1 })
    } else {
        await self.db.users.updateOne(
            { _id: message.author.id, 'activities.levels.guild_id': message.guildId },
            {
                $set: {
                    'activities.levels.$.activity.last_message_at': Date.now()
                },
                $inc: {
                    'activities.levels.$.experience.current': points,
                    'activities.levels.$.experience.total': points,
                    'activities.levels.$.activity.total_messages': 1
                }
            }
        )
    }

    self.emit('moduleExecution', {
        module: 'Levels',
        category: 'MessageCreate',
        guild: { id: message.guild.id, name: message.guild.name },
        target: { id: message.author.id, name: message.author.tag }
    })

    return true
}

export async function voiceAssign(self: Lacuna, server: ServerDocument, state: VoiceState): Promise<boolean> {
    const { levels } = server.modules

    if (!levels.voice) return false

    const isBlockedChannel = levels.blocked.channels.includes(state.channelId),
        isBlockedChannelParent = levels.blocked.channels.includes(state.channel.parentId),
        isBlockedRole = state.member.roles.cache.some(r => levels.blocked.roles.includes(r.id))
    const isNotAllowedChannel = levels.allowed.channels.length && !levels.allowed.channels.includes(state.channelId),
        isNotAllowedChannelParent = levels.allowed.channels.length && !levels.allowed.channels.includes(state.channel.parentId),
        isNotAllowedRole = levels.allowed.roles.length && !state.member.roles.cache.some(r => levels.allowed.roles.includes(r.id))

    if (isBlockedChannel || isBlockedChannelParent || isBlockedRole) return false
    if (isNotAllowedChannel) return false
    if (isNotAllowedRole) return false
    if (state.guild.afkChannelId === state.channelId) return false

    const members = state.channel.members.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

    if (members.size < 2) return false

    for (const [_, member] of members) {
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

        let level = user.activities.levels.find(i => i.guild_id == server._id)

        if (!level) {
            level = {
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
                    $push: { 'activities.levels': level as never }
                }
            )
        }

        if (!level.activity.voice_connected_at || Date.now() - level.activity.voice_connected_at > 36_000_000) {
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
        category: 'VoiceAssign',
        guild: { id: state.member.guild.id, name: state.member.guild.name },
        target: { id: state.member.id, name: state.member.user.tag }
    })

    return true
}

export async function voiceUnassign(self: Lacuna, server: ServerDocument, state: VoiceState, channel: BaseGuildVoiceChannel) {
    if (!server.modules.levels.voice) return false

    const members = channel?.members?.filter(m => !m.user.bot && !m.voice.serverMute && !m.voice.serverDeaf)

    if (members) {
        const targetMembers = members.size === 1 ? [state.member, members.first()] : [state.member]

        await voiceCount(self, server, targetMembers, channel)
    }
}

export async function voiceCount(self: Lacuna, server: ServerDocument, members: GuildMember[], channel: BaseGuildVoiceChannel) {
    const { activities } = server.modules

    for (const member of members) {
        const user = await self.db.users.findOne({ _id: member.user.id })
        const level = user?.activities?.levels?.find(i => i.guild_id === server._id)

        if (!level?.activity?.voice_connected_at) continue

        const current_xp: number = level.experience.current
        const current_level: number = level.experience.level,
            next_level: number = 150 + current_level * current_level * 8

        const multipliers = activities.multipliers
            .filter(i => {
                if (i.blocked_channels.includes(channel.id)) return false
                if (member.roles.cache.some(ii => i.blocked_roles.includes(ii.id))) return false
                if (i.allowed_channels.length && !i.allowed_channels.includes(channel.id)) return false
                if (i.allowed_roles.length && !member.roles.cache.some(ii => i.allowed_roles.includes(ii.id))) return false

                return i.options.includes('LEVELS_VOICE')
            })
            .slice(0, server.server.premium.available ? 10 : 1)

        const multiplier = multipliers.reduce((x, y) => x * (y.levels_voice_multiplier / 100), 100) / 100
        const time: number = (Date.now() - level.activity.voice_connected_at) / 1000
        let points: number =
            ((time / 60) * (time / 60 / 60 <= 0 ? 1 : time / 60 / 60) + (5 / 100) * time) *
            ((10 / 100) * current_level < 1 ? 1 : (10 / 100) * current_level)

        points *= multiplier || 1

        if (next_level - current_xp <= points) {
            let new_level: number, new_current_xp: number

            for (
                new_level = current_level, new_current_xp = points + current_xp;
                new_current_xp >= neededXp(new_level);
                new_current_xp -= neededXp(new_level), new_level++
            ) {}

            await self.db.users.updateOne(
                { _id: member.id, 'activities.levels.guild_id': server._id },
                {
                    $set: {
                        'activities.levels.$.experience.level': new_level,
                        'activities.levels.$.experience.current': Number(new_current_xp.toFixed(2)),
                        'activities.levels.$.experience.total': Number((neededTotalXp(new_level) + new_current_xp).toFixed(2)),
                        'activities.levels.$.activity.voice_connected_at': null
                    },
                    $inc: {
                        'activities.levels.$.activity.total_voice_time': Number(time.toFixed(2))
                    }
                }
            )

            await updateAwards(self, server, { member, level: new_level })
            await sendLevelUpAlert(self, server, { member, level: new_level })
        } else {
            await self.db.users.updateOne(
                { _id: member.id, 'activities.levels.guild_id': server._id },
                {
                    $inc: {
                        'activities.levels.$.experience.current': Number(points.toFixed(2)),
                        'activities.levels.$.experience.total': Number(points.toFixed(2)),
                        'activities.levels.$.activity.total_voice_time': Number(time.toFixed(2))
                    },
                    $set: {
                        'activities.levels.$.activity.voice_connected_at': null
                    }
                }
            )
        }

        self.emit('moduleExecution', {
            module: 'Levels',
            category: 'VoiceUnassign',
            guild: { id: member.guild.id, name: member.guild.name },
            target: { id: member.id, name: member.user.tag }
        })
    }
}

export async function updateAwards(self: Lacuna, server: ServerDocument, refs: { member: GuildMember; level: number }) {
    const { levels } = server.modules
    const member = refs.member

    const awards = levels.awards.slice(0, server.server.premium.available ? 200 : 50).sort((a, b) => b.level - a.level)
    const award = awards.find(i => i.level == refs.level)

    const prevAwards = awards.filter(i => i.level < refs.level)
    const prevAward = prevAwards[0]

    if (award) {
        if (award.type == 'ROLE') {
            const roles = member.guild.roles.cache.filter(r => r.editable && award.references.includes(r.id))

            if (roles.size) await member.roles.add(roles).catch(self.logger.error)

            for (const prevAward of prevAwards.filter(i => i.single)) {
                const prevRoles = member.guild.roles.cache.filter(r => r.editable && prevAward.references.includes(r.id))

                if (prevRoles.size) await member.roles.remove(prevRoles).catch(self.logger.error)
            }
        }

        self.emit('moduleExecution', {
            module: 'Levels',
            category: 'UpdateAwards',
            guild: { id: member.guild.id, name: member.guild.name },
            target: { id: member.id, name: member.user.tag }
        })
    }

    if (!award && prevAward) {
        if (prevAward.type === 'ROLE') {
            const roles = member.guild.roles.cache.filter(r => r.editable && prevAward.references.includes(r.id))

            if (roles.size) await member.roles.add(roles).catch(self.logger.error)

            for (const prevPrevAward of prevAwards.slice(1).filter(i => i.single)) {
                const prevRoles = member.guild.roles.cache.filter(r => r.editable && prevPrevAward.references.includes(r.id))

                if (prevRoles.size) await member.roles.remove(prevRoles).catch(self.logger.error)
            }
        }

        self.emit('moduleExecution', {
            module: 'Levels',
            category: 'UpdatePrevAwards',
            guild: { id: member.guild.id, name: member.guild.name },
            target: { id: member.id, name: member.user.tag }
        })
    }
}

export async function sendLevelUpAlert(self: Lacuna, server: ServerDocument, refs: { member?: GuildMember; message?: Message; level: number }) {
    const { levels } = server.modules
    const member = refs.message ? refs.message.member : refs.member

    const award = levels.awards.find(a => a.level == refs.level)
    const direction = award && award.alert && award.alert.active ? award.alert : levels.level_up_alerts

    if (direction.active) {
        const replacer = new Replacer(null, { message: refs.message, guild: member.guild, member: member })
        const congrats = await replacer.replaceTemplateMessage(direction.message)

        if (direction.format === 'CURRENT_CHANNEL' && refs.message) {
            await refs.message.channel.send(congrats).catch(self.logger.error)
        }

        if (direction.format === 'DM') {
            await member.send(congrats).catch(self.logger.error)
        }

        if (direction.format === 'CHANNEL') {
            const channel = member.guild.channels.cache.get(direction.channel_id) as BaseGuildTextChannel

            if (channel) await channel.send(congrats).catch(self.logger.error)
        }

        self.emit('moduleExecution', {
            module: 'Levels',
            category: 'LevelUpAlert',
            guild: { id: member.guild.id, name: member.guild.name },
            target: { id: member.id, name: member.user.tag }
        })
    }
}

export async function generateRankCard(
    self: Lacuna,
    signal: ChatInputCommandInteraction | ContextMenuCommandInteraction
): Promise<AttachmentBuilder> {
    let mention: GuildMember

    if (signal instanceof ChatInputCommandInteraction)
        mention = (signal.options?.getMember(self.i18n.t('en', 'commands.rank.options.user.name')) || signal.member) as GuildMember
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
    messageCreate,
    voiceAssign,
    voiceUnassign,
    voiceCount,
    updateAwards,
    sendLevelUpAlert,
    generateRankCard
}
