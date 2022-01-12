import { BaseGuildTextChannel, Guild, GuildMember, Message, MessageEmbed } from 'discord.js'
import moment from 'moment'
import { MessageEmbed as IMessageEmbed } from '../database/schemas/Servers'
import { LevelActivities, ServerActivitiesDocument } from '../database/schemas/ServerActivities'
import Lacuna from '../internals/Lacuna'
import { escapeRegexp, resolveObjectPath, parseCommandArguments } from '../internals/utility/Utils'

export default class Replacer {
    public self: Lacuna
    public string: string
    public shapers: ReplacerShapers

    constructor(self: Lacuna, string: string, shapers: ReplacerShapers) {
        this.self = self

        this.string = string

        this.shapers = shapers
    }

    replacers(string: string = this.string): string[] {
        const replacers = string.match(/{(?!-)\s*[^{}]+\s*}/gi) || []
        return replacers.map(replacer => replacer.replace(/{|}/g, '').trim())
    }

    codeSnippets(string: string = this.string) {
        const snippets: string[] = string.match(/{\-\s*[A-Z]+\([^{}]*\)\s*\-}/g) || []
        return snippets.map((snippet: string) => {
            snippet = snippet.replace(/{-|-}/g, '').trim()

            const name: string = snippet.match(/^[A-Z]+/).toString()
            const args: string = snippet.match(/\([^\-}]*\)$/).toString().replace(/^\(/, '').replace(/\)$/, '')

            const available: string[] = [
                'CHOOSE',
                'DATE',
                'DATENOW',
                'LOWER',
                'MATH',
                'NUMDECL',
                'RANDOM',
                'REPLACE',
                'TRUNCATE',
                'TRIM',
                'UPPER'
            ]

            if (available.includes(name)) {
                let fn = null

                switch (name) {
                    case 'CHOOSE':
                        fn = CHOOSE
                    break
                    case 'DATE':
                        fn = DATE
                    break
                    case 'DATENOW':
                        fn = DATENOW
                    break
                    case 'LOWER':
                        fn = LOWER
                    break
                    case 'MATH':
                        fn = MATH
                    break
                    case 'NUMDECL':
                        fn = NUMDECL
                    break
                    case 'RANDOM':
                        fn = RANDOM
                    break
                    case 'REPLACE':
                        fn = REPLACE
                    break
                    case 'TRUNCATE':
                        fn = TRUNCATE
                    break
                    case 'TRIM':
                        fn = TRIM
                    break
                    case 'UPPER':
                        fn = UPPER
                    break
                }

                return { name: name, args: args, fn }
            }
        }).filter(f => f)
    }

    async replacements() {
        const message = this.shapers.message
        const guild = this.shapers.guild
        const member = this.shapers.member
        const subs = this.shapers.subs

        const activity: ServerActivitiesDocument = await this.self.db.activities.fetch({ _id: guild.id })
        const levels: LevelActivities = activity.levels.find(level => level.user_id == member.id)
        const server_owner: GuildMember = await guild.members.fetch(guild.ownerId)

        const args: string[] = parseCommandArguments(message?.content?.split(' ')?.slice(1)?.join(' '))

        return {
            message: {
                content: message?.content,
                channel: {
                    name: (message?.channel as BaseGuildTextChannel)?.name,
                    id: message?.channel?.id,
                    mention: `<#${message?.channel?.id ?? '1'}>`,
                    nsfw: (message?.channel as BaseGuildTextChannel)?.nsfw,
                    position: (message?.channel as BaseGuildTextChannel)?.rawPosition?.toString(),
                    topic: (message?.channel as BaseGuildTextChannel)?.topic,
                    type: message?.channel?.type
                },
                args: Object.assign({}, { map: args.join(' '), ...args }),
                created_at: message?.createdTimestamp,
                edited_at: message?.editedTimestamp,
                id: message?.id,
                tts: message?.tts,
                type: message?.type,
                url: message?.url,
                mentions: {
                    members: message?.mentions?.members?.size ? Object.assign({},
                        ...message?.mentions?.members?.map(
                            (m, i, col) => ({
                                [[ ...col.keys() ].indexOf(i)]: {
                                    mention: `<@${m.id}>`,
                                    username: m.user.username,
                                    avatar: m.displayAvatarURL(),
                                    discriminator: m.user.discriminator,
                                    display_name: m.displayName,
                                    id: m.id,
                                    tag: m.user.tag,
                                    bot: m.user.bot,
                                    created_at: m.user.createdTimestamp,
                                    joined_at: m.joinedTimestamp,
                                    nickname: m.nickname,
                                    voice: {
                                        name: m.voice?.channel?.name,
                                        id: m.voice?.channelId,
                                        mention: m.voice ? `<#${m.voice.channelId}>` : null,
                                        full: m.voice?.channel?.full,
                                        position: m.voice?.channel?.rawPosition?.toString()
                                    },
                                    roles: Object.assign({},
                                        ...m.roles.cache.map(
                                            r => ({
                                                [r.id]: {
                                                    name: r.name,
                                                    mention: `<@&${r.id}>`,
                                                    id: r.id,
                                                    position: r.rawPosition.toString(),
                                                    color: r.hexColor,
                                                    created_at: r.createdTimestamp
                                                }
                                            })
                                        )
                                    )
                                }
                            })
                        )
                    ) : {},
                    roles: message?.mentions?.roles?.size ? Object.assign({},
                        ...message?.mentions?.roles?.map(
                            (m, i, col) => ({
                                [[ ...col.keys() ].indexOf(i)]: {
                                    mention: `<@&${m.id}>`,
                                    name: m.name,
                                    id: m.id,
                                    position: m.rawPosition.toString(),
                                    color: m.hexColor,
                                    created_at: m.createdTimestamp
                                }
                            })
                        )
                    ) : {},
                    channels: message?.mentions?.channels?.size ? Object.assign({},
                        ...message?.mentions?.channels?.map(
                            (m, i, col) => ({
                                [[ ...col.keys() ].indexOf(i)]: {
                                    mention: `<#${m.id}>`,
                                    type: m.type
                                }
                            })
                        )
                    ) : {}
                }
            },
            guild: {
                name: guild.name,
                acronym: guild.nameAcronym,
                afk_channel_id: guild.afkChannelId,
                system_channel_id: guild.systemChannelId,
                public_updates_channel_id: guild.publicUpdatesChannelId,
                rules_channel_id: guild.rulesChannelId,
                banner: guild.banner,
                channels: {
                    total: guild.channels.cache.size,
                    text: guild.channels.cache.filter(channel => channel.type == 'GUILD_TEXT').size,
                    voice: guild.channels.cache.filter(channel => channel.type == 'GUILD_VOICE').size,
                    news: guild.channels.cache.filter(channel => channel.type == 'GUILD_NEWS').size,
                    category: guild.channels.cache.filter(channel => channel.type == 'GUILD_CATEGORY').size,
                    store: guild.channels.cache.filter(channel => channel.type == 'GUILD_STORE').size
                },
                created_at: guild.createdTimestamp,
                description: guild.description,
                icon: guild.iconURL(),
                id: guild.id,
                members: {
                    total: guild.memberCount,
                    bots: guild.members.cache.filter(member => member.user.bot).size,
                    users: guild.members.cache.filter(member => !member.user.bot).size
                },
                owner: {
                    username: server_owner?.user?.username,
                    avatar: server_owner?.user?.displayAvatarURL(),
                    display_name: server_owner?.displayName,
                    tag: server_owner?.user?.tag,
                    mention: `<@${guild.ownerId}>`,
                    nickname: server_owner?.nickname
                },
                boosters_count: guild.premiumSubscriptionCount || 0,
                boost_tier: guild.premiumTier,
                splash: guild.splash,
                vanity_url: guild.vanityURLCode ? `https://discord.gg/${guild.vanityURLCode}` : null
            },
            member: {
                username: member.user.username,
                avatar: member.user.displayAvatarURL(),
                discriminator: member.user.discriminator,
                display_name: member.displayName,
                id: member.id,
                tag: member.user.tag,
                bot: member.user.bot,
                mention: `<@${member.id}>`,
                created_at: member.user.createdTimestamp,
                joined_at: member.joinedTimestamp,
                nickname: member.nickname,
                premium_since: member.premiumSinceTimestamp,
                level: {
                    rank: levels?.experience?.level ?? 0,
                    current_xp: levels?.experience?.current ?? 0,
                    remaining_xp: levels ? Math.round((150 + (levels.experience.level * levels.experience.level * 8)) - levels.experience.current) : 0,
                    need_xp: levels ? 150 + (levels.experience.level * levels.experience.level * 8) : 0,
                    total_xp: levels?.experience?.total ?? 0,
                    total_messages: levels?.activity?.text?.total_messages ?? 0,
                    voice_time: levels?.activity?.voice?.total_time ?? 0
                },
                voice: {
                    name: member.voice?.channel?.name,
                    id: member.voice?.channelId,
                    mention: member.voice?.channelId ? `<#${member.voice.channelId}>` : null,
                    full: member.voice?.channel?.full,
                    position: member.voice?.channel?.rawPosition?.toString()
                },
                roles: Object.assign({},
                    ...member.roles.cache.map(
                        r => ({
                            [r.id]: {
                                name: r.name,
                                mention: `<@&${r.id}>`,
                                id: r.id,
                                position: r.rawPosition.toString(),
                                color: r.hexColor,
                                created_at: r.createdTimestamp
                            }
                        })
                    )
                )
            },
            subs: {
                name: subs?.name ?? null,
                title: subs?.title ?? null,
                link: subs?.link ?? null
            },
            index: this.shapers.index ?? 0,
            penalty: {
                reason: this.shapers.penalty?.reason
            }
        }
    }

    async replace(string: string = this.string) {
        const replacements = await this.replacements()

        for (const replacer of this.replacers(string)) {
            const regex = new RegExp(`{\\s*${escapeRegexp(replacer)}\\s*}`, 'g')
            const raws = replacer.split(/\s+\|\s+/)

            for (const replacement of raws) {
                const i = raws.indexOf(replacement)
                let value = resolveObjectPath(replacement, replacements)

                if (typeof value === 'object' && value != null) value = resolveObjectPath(`${replacement}.${Object.keys(value)[0]}`, replacements)

                if (/".+"/.test(replacement)) raws[i] = replacement.substring(1, replacement.length - 1)
                else raws[i] = value
            }

            string = string.replace(regex, () => { return raws.find(r => r) })
        }

        for (const snippet of this.codeSnippets(string)) {
            const regex = new RegExp(`{-\\s*${escapeRegexp(snippet.name)}\([^\-}]*\)\\s*-}`, 'g')

            let res: string

            try {
                res = snippet.fn(...snippet.args.split(/;\s{0,1}/))
            } catch (err) {
                res = `\`${snippet.name}#${err.name}\``
            }

            string = string.replace(regex, () => { return res })
            this.self.logger.info(`(Replacer: ${snippet.name}): on ${this.shapers.guild.name}`)
        }

        return string
    }

    async replaceTemplateMessage(template: { content: string, embed?: IMessageEmbed }) {
        const content = await this.replace(template.content)
        let embed = {}

        if (template.embed && template.embed.active) {
            const image_url = template.embed.image.url ? await this.replace(template.embed.image.url) : null
            const footer_icon_url = template.embed.footer.icon_url ? await this.replace(template.embed.footer.icon_url) : null
            const thumbnail_url = template.embed.thumbnail.url ? await this.replace(template.embed.thumbnail.url) : null
            const avatar_icon_url = template.embed.author.icon_url ? await this.replace(template.embed.author.icon_url) : null

            embed = {
                title: template.embed.title ? await this.replace(template.embed.title) : null,
                description: template.embed.description ? await this.replace(template.embed.description) : null,
                url: template.embed.url ? await this.replace(template.embed.url) : null,
                timestamp: template.embed.timestamp ? Number(await this.replace(template.embed.timestamp)) : null,
                color: template.embed.color ? template.embed.color : null,
                footer: {
                    text: template.embed.footer.text ? await this.replace(template.embed.footer.text) : null,
                    icon_url: footer_icon_url
                },
                image: image_url ? { url: image_url } : null,
                thumbnail: thumbnail_url ? { url: thumbnail_url } : null,
                author: {
                    name: template.embed.author.name ? await this.replace(template.embed.author.name) : null,
                    url: template.embed.author.url ? await this.replace(template.embed.author.url) : null,
                    icon_url: avatar_icon_url
                },
                fields: template.embed.fields.length ? await Promise.all(
                    template.embed.fields.map(async field => {
                        return {
                            name: field.name ? await this.replace(field.name) : null,
                            value: field.value ? await this.replace(field.value) : null,
                            inline: Boolean(field.inline)
                        }
                    })
                ) : []
            }
        }

        const returning = {} as { content: string, embeds: MessageEmbed[] }

        if (content) returning['content'] = content
        if (template.embed && template.embed.active) returning['embeds'] = [ new MessageEmbed(embed) ]

        return returning
    }
}

function CHOOSE(...args: string[]) {
    if (!args.some(arg => typeof arg !== 'number' || typeof arg !== 'string')) throw new TypeError()
    if (!args.length || args.length <= 1) throw new ReferenceError()

    const random = Math.floor(Math.random() * args.length)
    return args[random]
}

function DATE(...args: string[]) {
    let timestamp = Number(args[0]), format = args[1], utc = args[2], locale = args[3]

    if (typeof timestamp !== 'number' || isNaN(timestamp)) timestamp = Date.now()
    if (typeof format !== 'string') format = 'DD MMM YYYY HH:mm'
    if (!(/\+\d{2}:\d{2}/.test(utc))) utc = '+00:00'
    if (typeof locale !== 'string' || !['en', 'ru'].includes(locale)) locale = 'ru'

    return moment(timestamp).locale(locale).utcOffset(utc).format(format)
}

function DATENOW() {
    return Date.now()
}

function LOWER(...args: string[]) {
    let str = args[0]

    if (typeof str !== 'string') throw new TypeError()

    return str.toLowerCase()
}

function MATH(...args: any[]) {
    let expression = args[0], digits = Number(args[1])

    if (typeof expression !== 'string') throw new TypeError()
    if (typeof digits !== 'number' || (digits < 0 || digits > 20) || isNaN(digits)) digits = 0

    expression = expression.match(/(?:[0-9\-\+\*\/\^\(\)])+/g) || []

    let result = eval(expression.join(' '))

    if (typeof result !== 'number') result = Number(result)

    return result.toFixed(digits)
}

function NUMDECL(...args: string[]) {
    let number = Number(args[0]), titles = args[1]?.split('|'), locale = args[2]

    if (typeof number !== 'number' || isNaN(number)) throw new TypeError()
    if (!Array.isArray(titles) || titles.length <= 1) throw new TypeError()
    if (typeof locale !== 'string' || !['ru', 'en'].includes(locale)) locale = 'ru'

    if (locale == 'ru') {
        const cases = [2, 0, 1, 1, 1, 2]

        return titles[ (number % 100 > 4 && number % 100 < 20) ? 2 : cases[ (number % 10 < 5) ? number % 10 : 5] ]
    }

    if (locale == 'en') {
        return number > 1 ? titles[1] : titles[0]
    }
}

function RANDOM(...args: string[]) {
    let start = Number(args[0]), end = Number(args[1])

    if (typeof start !== 'number' || isNaN(start) || start < -Math.pow(2, 53)) start = 0
    if (typeof end !== 'number' || isNaN(end) || end > Math.pow(2, 53)) end = 100

    return `${Math.floor(Math.random() * end) + start}`
}

function REPLACE(...args) {
    let str = args[0], search = args[1], replacement = args[2], flags = args[3]

    if (typeof str !== 'string' || typeof search !== 'string' || typeof replacement !== 'string') throw new TypeError()
    if (!flags || !flags.split('').some(flag => ['g', 'i'].includes(flag))) flags = 'g'

    const regex = new RegExp(`${search}`, flags)

    return str.replace(regex, replacement)
}

function TRUNCATE(...args: string[]) {
    let str = args[0], limit = Number(args[1]), end = args[2]

    if (typeof str !== 'string') throw new TypeError()
    if (typeof limit !== 'number') limit = 100
    if (typeof end !== 'string') end = '...'

    if (str.length > limit)
        return str.substring(0, limit) + end
    else
        return str
}

function TRIM(...args: string[]) {
    let str = args[0]

    if (typeof str !== 'string') throw new TypeError()

    return str.replace(/\s+/g, ' ').trim()
}

function UPPER(...args: string[]) {
    let str = args[0]

    if (typeof str !== 'string') throw new TypeError()

    return str.toUpperCase()
}

export interface ReplacerShapers {
    guild: Guild
    member: GuildMember
    message?: Message
    subs?: {
        name: string
        title: string
        link: string
    }
    index?: number
    penalty?: {
        reason?: string
    }
}