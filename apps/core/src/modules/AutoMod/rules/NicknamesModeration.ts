import { type ServerDocument, type ServerModerationAutoModNicknames } from '@/database/schemas/Servers.js'
import Lacuna from '@/internals/Lacuna.js'
import { banish, chars } from '@favware/zalgo'
import { GuildMember } from 'discord.js'

const predefinedNicknames = [
    'Foggy',
    'Magnanimous',
    'Taboo',
    'Compulsive',
    'Busy',
    'Angry',
    'Responsive',
    'Amiable',
    'Nice',
    'Unexpected'
]

export default async function moderateNicknames(self: Lacuna, server: ServerDocument, member: GuildMember) {
    const reason = 'AutoMod: Nicknames moderation'
    const config = server.moderation.automoder.nicknames

    if (!config.active) return false

    const configPermissions = BigInt(config.ignored.permissions.reduce((x, y) => x | y, 0))

    if (member.user.bot && config.ignored.bots) return false
    if (member.permissions.any(configPermissions, false)) return false
    if (member.roles.cache.some(r => config.ignored.roles.includes(r.id))) return false

    let nickname = adjustNickname(config, member.displayName)

    if (!nickname.length) {
        const random = Math.floor(Math.random() * predefinedNicknames.length)
        nickname = predefinedNicknames[random]!
    }

    if (member.manageable && nickname !== member.displayName) {
        try {
            await member.setNickname(nickname, reason)
        } catch (err) {
            self.logger.error({ module: 'AutoMod', action: 'SetNickname', err, guildId: member.guild.id })
        }

        self.emit('moduleExecution', {
            guildId: member.guild.id,
            targetId: member.id,
            module: 'AutoMod',
            category: 'NicknamesModeration'
        })
    }

    return true
}

function adjustNickname(config: ServerModerationAutoModNicknames, name: string): string {
    const regexps = {
        special_characters: /[-!@#$%\^&*()_=+\[\]\\{};:'"|,<.>\/?]/g,
        emojis: /\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}/gu
    }

    const split = name.split(/\s{1,}/)

    if (regexps.special_characters.test(name) && config.options.includes('SPECIAL_CHARACTERS'))
        name = name.replace(regexps.special_characters, '')
    if (chars.pattern!.test(name) && config.options.includes('ZALGO')) name = banish(name)
    if (config.options.includes('DIACRITICS')) name = name.normalize('NFD').replace(/\p{Diacritic}/gu, '')
    if (regexps.emojis.test(name) && config.options.includes('EMOJIS')) name = name.replace(regexps.emojis, '')

    if (config.contains.some(c => split.includes(c))) {
        config.contains.forEach(c => (name = name.replace(c, '')))
    }

    return name.trim()
}
