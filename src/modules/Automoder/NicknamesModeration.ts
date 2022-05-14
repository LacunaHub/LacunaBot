import { GuildMember } from 'discord.js'
import { clean, isZalgo } from 'unzalgo'
import { ServerDocument } from '../../database/schemas/Servers'
import Lacuna from '../../internals/Lacuna'

const reason = 'Автомодер: Модерирование никнеймов'

const adjectives = ['Foggy', 'Magnanimous', 'Taboo', 'Compulsive', 'Busy', 'Angry', 'Responsive', 'Amiable', 'Nice', 'Unexpected']

export default async function (self: Lacuna, server: ServerDocument, member: GuildMember) {
    const config = server.moderation.automoder.nicknames

    if (!config.active) return false
    if (member.user.bot && config.ignored.bots) return false
    if (member.permissions.any(BigInt(config.ignored.permissions), false)) return false

    if (member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

    let name = adjustNickname(config.types, member.displayName)

    if (!name.length) {
        const random = Math.floor(Math.random() * adjectives.length)

        name = adjectives[random]
    }

    if (member.manageable && name != member.displayName) {
        await member.setNickname(name, reason).catch(self.logger.error)

        self.emit('moduleExecution', {
            module: 'Automoder: Nickname Moderation',
            guild: { id: member.guild.id, name: member.guild.name },
            target: { id: member.id, name: member.user.tag }
        })
    }

    return true
}

function adjustNickname(types: ServerDocument['moderation']['automoder']['nicknames']['types'], name: string): string {
    const regexps = {
        special_characters: /[-!@#$%\^&*()_=+\[\]\\{};:'"|,<.>\/?]/g,
        emojis: /\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}/gu
    }

    const split = name.split(/\s{1,}/)

    if (regexps.special_characters.test(name) && types.special_characters) name = name.replace(regexps.special_characters, '')
    if (isZalgo(name) && types.zalgo) name = clean(name)
    if (types.diacritics) name = name.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    if (regexps.emojis.test(name) && types.emojis) name = name.replace(regexps.emojis, '')

    if (types.contains.some(c => split.includes(c))) {
        types.contains.forEach(c => (name = name.replace(c, '')))
    }

    return name.trim()
}
