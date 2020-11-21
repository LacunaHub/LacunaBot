const moment = require('moment')

class Replacer {
    constructor() {
        throw new Error(`The ${this.constructor.name} class can't be called via 'new'`)
    }

    /**
     * @param {import('../internals/Lacuna')} self
     * @param {String} string
     * @param {Object} stuff
     * @param {import('discord.js').Message} stuff.message
     * @param {import('discord.js').Guild} stuff.guild
     * @param {import('discord.js').GuildMember} stuff.member
     */
    static async Replace(self, string, stuff) {
        const message = stuff.message
        const guild = stuff.guild
        const member = stuff.member

        const replacers = {
            'message.channel': message ? message.channel.name : '`message.channel`',
            'message.channel.id': message ? message.channel.id : '`message.channel.id`',
            'message.channel.mention': message ? `<#${message.channel.id}>` : '`message.channel.mention`',
            'message.channel.nsfw': message ? message.channel.nsfw : '`message.channel.nsfw`',
            'message.channel.position': message ? message.channel.position : '`message.channel.position`',
            'message.channel.topic': message ? message.channel.topic || '`message.channel.topic`' : '`message.channel.topic`',
            'message.channel.type': message ? message.channel.type : '`message.channel.type`',
            'message.content': message ? message.content : '`message.content`',
            'message.created_at': message ? message.createdTimestamp : '`message.created_at`',
            'message.edited_at': message ? message.editedTimestamp || '`message.edited_at`' : '`message.edited_at`',
            'message.id': message ? message.id : '`message.id`',
            'message.tts': message ? message.tts : '`message.tts`',
            'message.type': message ? message.type : '`message.type`',
            'message.url': message ? message.url : '`message.url`',
            'guild': guild.name,
            'guild.acronym': guild.nameAcronym,
            'guild.afk_channel_id': guild.afkChannelID || '`guild.afk_channel_id`',
            'guild.banner': guild.bannerURL || '`guild.banner`',
            'guild.channels': guild.channels.cache.size,
            'guild.channels.text': guild.channels.cache.filter(channel => channel.type == 'text').size,
            'guild.channels.voice': guild.channels.cache.filter(channel => channel.type == 'voice').size,
            'guild.created_at': guild.createdTimestamp,
            'guild.description': guild.description || '`guild.description`',
            'guild.icon': guild.iconURL(),
            'guild.id': guild.id,
            'guild.members': guild.memberCount,
            'guild.members.bots': guild.members.cache.filter(member => member.user.bot).size,
            'guild.members.users': guild.members.cache.filter(member => !member.user.bot).size,
            'guild.owner': guild.owner ? guild.owner.user.username : '`guild.owner`',
            'guild.owner.avatar': guild.owner ? guild.owner.user.displayAvatarURL() : '`guild.owner.avatar`',
            'guild.owner.display_name': guild.owner ? guild.owner.displayName : '`guild.owner.display_name`',
            'guild.owner.id': guild.ownerID,
            'guild.owner.tag': guild.owner ? guild.owner.user.tag : '`guild.owner.tag`',
            'guild.owner.mention': `<@${guild.ownerID}>`,
            'guild.owner.nickname': guild.owner ? guild.owner.nickname || '`guild.owner.nickname`' : '`guild.owner.nickname`',
            'guild.boosters_count': guild.premiumSubscriptionCount || 0,
            'guild.boost_tier': guild.premiumTier,
            'guild.region': guild.region,
            'guild.splash': guild.splash || '`guild.splash`',
            'guild.vanity_url': guild.vanityURLCode ? `https://discord.gg/${guild.vanityURLCode}` : '`guild.vanity_url`',
            'member': member.user.username,
            'member.avatar': member.user.displayAvatarURL(),
            'member.discriminator': member.user.discriminator,
            'member.display_name': member.displayName,
            'member.id': member.id,
            'member.tag': member.user.tag,
			'member.mention': `<@${member.id}>`,
            'member.joined_at': member.joinedTimestamp,
            'member.nickname': member.nickname || '`member.nickname`',
            'member.premium_since': member.premiumSinceTimestamp
        }

        let patterns = string.match(/{\s*([\w.]+)\s*}/g) || []
        let functions = string.match(/{\-\s*(\w+\(.*?\))\s*\-}/g) || []

        patterns = patterns.map(pattern => pattern.replace(/{|}/g, '').trim())
        functions = functions.map(func => {
            const ref = func.replace(/{-|-}/g, '').trim()
            const regex = ref.match(/[\w]+|\(.*?\)/g)

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
        
            if (!regex || !regex[0] || !regex[1] || !available.includes(regex[0])) return null

            let args = regex[1].replace(/^\(/, '').replace(/\)$/, '')

            let args_patterns = args.match(/{\s*([\w.]+)\s*}/g) || []
            args_patterns = args_patterns.map(pattern => pattern.replace(/{|}/g, '').trim())

            for (const pattern of args_patterns) {
                const regex = new RegExp(`{\\s*${pattern}\\s*}`, 'g')
                args = args.replace(regex, typeof replacers[pattern] !== 'undefined' ? replacers[pattern] : `\`${pattern}\``)
            }
        
            return {
                name: regex[0],
                args: args
            }
        }).filter(func => func)

        for (const pattern of patterns) {
            const regex = new RegExp(`{\\s*${pattern}\\s*}`, 'g')
            string = string.replace(regex, typeof replacers[pattern] !== 'undefined' ? replacers[pattern] : `\`${pattern}\``)
        }

        for (const func of functions) {
            const regex = new RegExp(`{-\\s*${func.name}\(.*?\)\\s*-}`, 'g')
            let res
            try {
                res = eval(`${func.name}(${func.args})`)
            } catch (err) {
                res = `\`${func.name}(${func.args})\``
            }

            string = string.replace(regex, res)
            self.logger.info(`(Replacer: ${func.name}): on ${guild.name}`)
        }

        return string
    }
}

function CHOOSE(...args) {
    if (!args.some(arg => typeof arg !== 'number' || typeof arg !== 'string')) throw new TypeError('Invalid function arguments was provided')
    if (!args.length || args.length <= 1) throw new ReferenceError('Please specify 2 or more arguments')

    const random = Math.floor(Math.random() * args.length)
    return args[random]
}

function DATE(date = Date.now(), format = 'DD MMM YYYY HH:mm', utc_offset = '+00:00', locale = 'ru') {
    if (typeof date !== 'number' && !(date instanceof Date)) date = Date.now()
    if (typeof format !== 'string') format = 'DD MMM YYYY HH:mm'
    if (!(/\+\d{2}:\d{2}/.test(utc_offset))) utc_offset = '+00:00'
    if (typeof locale !== 'string' || !['en', 'ru'].includes(locale)) locale = 'ru'

    return moment(new Date(date)).locale(locale).utcOffset(utc_offset).format(format)
}

function LOWER(str) {
    if (typeof str !== 'string') throw new TypeError('Invalid function arguments was provided')

    return str.toLowerCase()
}

function MATH(expression, digits = 0) {
    if (typeof expression !== 'string') throw new TypeError('Invalid function arguments was provided')
    if (typeof digits !== 'number' || (digits < 0 || digits > 20)) digits = 0

    expression = expression.match(/(?:[0-9-+*/^()x])+/g)

    let result = eval(expression.join(' '))

    if (typeof result !== 'number') result = Number(result)

    return Number(result.toFixed(digits))
}

function NUMDECL(number, titles, language = 'ru') {
    if (typeof number !== 'number' || isNaN(number)) throw new TypeError('Invalid function arguments was provided')
    if (!Array.isArray(titles) || titles.length <= 1) throw new TypeError('Invalid function arguments was provided')
    if (typeof language !== 'string' || !['ru', 'en'].includes(language)) language = 'ru'

    if (language == 'ru') {
        const cases = [2, 0, 1, 1, 1, 2]

        return titles[ (number % 100 > 4 && number % 100 < 20) ? 2 : cases[ (number % 10 < 5) ? number % 10 : 5] ]
    }

    if (language == 'en') {
        return number > 1 ? titles[1] : titles[0]
    }
}

function RANDOM(start = 0, end = 100) {
    if (typeof start !== 'number' || typeof end !== 'number') throw new TypeError('Invalid function arguments was provided')

    const random = Math.floor(Math.random() * end) + start
    return random
}

function REPLACE(str, search, replacement, flags = 'g') {
    if (typeof str !== 'string' || typeof search !== 'string' || typeof replacement !== 'string') throw new TypeError('Invalid function arguments was provided')
    if (!flags.split('').some(flag => ['g', 'i'].includes(flag))) throw new ReferenceError('Unknown flag')

    const regex = new RegExp(`${search}`, flags)

    return str.replace(regex, replacement)
}

function TRUNCATE(str, limit = 100, end = '...') {
    if (typeof str !== 'string') throw new TypeError('Invalid function arguments was provided')
    if (typeof limit !== 'number') limit = 100
    if (typeof end !== 'string') end = '...'

    if (str.length > limit)
        return str.substring(0, limit) + end
    else
        return str
}

function TRIM(str) {
    if (typeof str !== 'string') throw new TypeError('Invalid function arguments was provided')

    return str.replace(/\s+/g, ' ').trim()
}

function UPPER(str) {
    if (typeof str !== 'string') throw new TypeError('Invalid function arguments was provided')

    return str.toUpperCase()
}

module.exports = Replacer