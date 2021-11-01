const { MessageEmbed } = require('discord.js')
const moment = require('moment')
const { escapeRegEx, resolveObjectPath, parseCommandArguments } = require('../internals/utility/Utils')

class Replacer {
    /**
     * @param {import('../internals/Lacuna')} self
     * @param {string} string 
     * @param {Object} shapers
     * @param {import('discord.js').Message} shapers.message
     * @param {import('discord.js').Guild} shapers.guild
     * @param {import('discord.js').GuildMember} shapers.member
     * @param {import('../internals/Typings').TwitchChannel|import('../internals/Typings').YouTubeChannel} shapers.subs
     */
    constructor(self, string, shapers) {
        this.self = self

        this.string = string

        this.shapers = shapers
    }

    replacers(string = this.string) {
        const replacers = string.match(/{\s*([\d\s\w.,|"-+?!:@<>#%]+)\s*}/g) || []
        return replacers.map(replacer => replacer.replace(/{|}/g, '').trim())
    }

    codeSnippets(string = this.string) {
        const snippets = string.match(/{\-\s*[A-Z]+\([^\-}]*\)\s*\-}/g) || []
        return snippets.map(snippet => {
            snippet = snippet.replace(/{-\s*|\s*-}/g, '')

            const name = snippet.match(/^[A-Z]+/).toString()
            const args = snippet.match(/\([^\-}]*\)$/).toString().replace(/^\(/, '').replace(/\)$/, '')

            const available = [
                'CHOOSE',
                'DATE',
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
                let fn = undefined

                switch (name) {
                    case 'CHOOSE':
                        fn = CHOOSE
                    break
                    case 'DATE':
                        fn = DATE
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

        const activity = await this.self.db.activities.fetch({ _id: guild.id })
        const levels = activity.levels.find(level => level.user_id == member.id)
        const server_owner = await guild.members.fetch(guild.ownerId)

        const args = parseCommandArguments(message?.content?.split(' ')?.slice(1)?.join(' '))

        return {
            message: {
                content: message?.content,
                channel: {
                    name: message?.channel?.name,
                    id: message?.channel?.id,
                    mention: `<#${message?.channel?.id ?? '1'}>`,
                    nsfw: message?.channel?.nsfw,
                    position: message?.channel?.rawPosition,
                    topic: message?.channel?.topic,
                    type: message?.channel?.type
                },
                args: args,
                created_at: message?.createdTimestamp,
                edited_at: message?.editedTimestamp,
                id: message?.id,
                tts: message?.tts,
                type: message?.type,
                url: message?.url,
                mentions: {
                    users: Object.assign({}, { ...message?.mentions?.users?.map(m => `<@${m.id}>`) }),
                    roles: Object.assign({}, { ...message?.mentions?.roles?.map(m => `<@&${m.id}>`) }),
                    channels: Object.assign({}, { ...message?.mentions?.channels?.map(m => `<#${m.id}>`) })
                }
            },
            guild: {
                name: guild.name,
                acronym: guild.nameAcronym,
                afk_channel_id: guild?.afkChannelId,
                banner: guild?.banner,
                channels: {
                    total: guild.channels.cache.size,
                    text: guild.channels.cache.filter(channel => channel.type == 'text').size,
                    voice: guild.channels.cache.filter(channel => channel.type == 'voice').size,
                    news: guild.channels.cache.filter(channel => channel.type == 'news').size,
                    category: guild.channels.cache.filter(channel => channel.type == 'category').size,
                    store: guild.channels.cache.filter(channel => channel.type == 'store').size
                },
                created_at: guild.createdTimestamp,
                description: guild?.description,
                icon: guild?.icon,
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
                    total_xp: levels?.experience?.total ?? 0
                },
                voice: {
                    name: member.voice?.channel?.name,
                    id: member.voice?.channelId,
                    mention: member.voice ? `<#${member.voice.channelId}>` : null,
                    full: member.voice?.channel?.full,
                    position: member.voice?.channel?.rawPosition
                },
                roles: Object.assign(...member.roles.cache.map(r => ({ [r.id]: { id: r.id, name: r.name } })))
            },
            subs: {
                name: subs?.name ?? null,
                title: subs?.title ?? null,
                link: subs?.link ?? null
            },
            index: this.shapers.index ?? 0
        }
    }

    async replace(string = this.string) {
        const replacements = await this.replacements()

        for (const replacer of this.replacers(string)) {
            const regex = new RegExp(`{\\s*${escapeRegEx(replacer)}\\s*}`, 'g')
            const raws = replacer.split(/\s+\|\s+/)

            for (const replacement of raws) {
                const i = raws.indexOf(replacement)
                let value = resolveObjectPath(replacement, replacements)

                if (typeof value === 'object') value = resolveObjectPath(`${replacement}.${Object.keys(value)[0]}`, replacements)

                if (/".+"/.test(replacement)) raws[i] = replacement.substring(1, replacement.length - 1)
                else raws[i] = value
            }

            string = string.replace(regex, () => { return raws.find(r => r) })
        }

        for (const snippet of this.codeSnippets(string)) {
            const regex = new RegExp(`{-\\s*${escapeRegEx(snippet.name)}\([^\-}]*\)\\s*-}`, 'g')

            let res

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

    /**
     * @param {Template} template
     */
    async replaceTemplateMessage(template) {
        const content = await this.replace(template.content)
        let embed = {}

        if (template.embed.active) {
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
                fields: template.embed.fields.length ? await Promise.all(template.embed.fields.map(async field => {
                    return {
                        name: field.name ? await this.replace(field.name) : null,
                        value: field.value ? await this.replace(field.value) : null,
                        inline: Boolean(field.inline)
                    }
                })) : []
            }
        }

        return template.embed.active ? { content: content, embeds: [new MessageEmbed(embed)] } : { content: content }
    }
}

function CHOOSE(...args) {
    if (!args.some(arg => typeof arg !== 'number' || typeof arg !== 'string')) throw new TypeError()
    if (!args.length || args.length <= 1) throw new ReferenceError()

    const random = Math.floor(Math.random() * args.length)
    return args[random]
}

function DATE(...args) {
    let timestamp = Number(args[0]), format = args[1], utc = args[2], locale = args[3]

    if (typeof timestamp !== 'number' || isNaN(timestamp)) timestamp = Date.now()
    if (typeof format !== 'string') format = 'DD MMM YYYY HH:mm'
    if (!(/\+\d{2}:\d{2}/.test(utc))) utc = '+00:00'
    if (typeof locale !== 'string' || !['en', 'ru'].includes(locale)) locale = 'ru'

    return moment(timestamp).locale(locale).utcOffset(utc).format(format)
}

function LOWER(...args) {
    let str = args[0]

    if (typeof str !== 'string') throw new TypeError()

    return str.toLowerCase()
}

function MATH(...args) {
    let expression = args[0], digits = Number(args[1])

    if (typeof expression !== 'string') throw new TypeError()
    if (typeof digits !== 'number' || (digits < 0 || digits > 20) || isNaN(digits)) digits = 0

    expression = expression.match(/(?:[0-9\-\+\*\/\^\(\)])+/g) || []

    let result = eval(expression.join(' '))

    if (typeof result !== 'number') result = Number(result)

    return result.toFixed(digits)
}

function NUMDECL(...args) {
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

function RANDOM(...args) {
    let start = Number(args[0]), end = Number(args[1])

    if (typeof start !== 'number' || isNaN(start) || start < -Math.pow(2, 53)) start = 0
    if (typeof end !== 'number' || isNaN(end) || end > Math.pow(2, 53)) end = 100

    return Math.floor(Math.random() * end) + start
}

function REPLACE(...args) {
    let str = args[0], search = args[1], replacement = args[2], flags = args[3]

    if (typeof str !== 'string' || typeof search !== 'string' || typeof replacement !== 'string') throw new TypeError()
    if (!flags || !flags.split('').some(flag => ['g', 'i'].includes(flag))) flags = 'g'

    const regex = new RegExp(`${search}`, flags)

    return str.replace(regex, replacement)
}

function TRUNCATE(...args) {
    let str = args[0], limit = Number(args[1]), end = args[2]

    if (typeof str !== 'string') throw new TypeError()
    if (typeof limit !== 'number') limit = 100
    if (typeof end !== 'string') end = '...'

    if (str.length > limit)
        return str.substring(0, limit) + end
    else
        return str
}

function TRIM(...args) {
    let str = args[0]

    if (typeof str !== 'string') throw new TypeError()

    return str.replace(/\s+/g, ' ').trim()
}

function UPPER(...args) {
    let str = args[0]

    if (typeof str !== 'string') throw new TypeError()

    return str.toUpperCase()
}

module.exports = Replacer