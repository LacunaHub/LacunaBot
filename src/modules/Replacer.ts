import { AttachmentBuilder, BaseGuildTextChannel, ChannelType, EmbedBuilder, Guild, GuildMember, Message, resolveColor } from 'discord.js'
import moment from 'moment'
import db from '../database'
import { MessageEmbed as IMessageEmbed, MessageImage } from '../database/schemas/Servers'
import { IUserLevel, IUserWallet } from '../database/schemas/Users'
import { escapeRegexp, resolveObjectPath } from '../internals/utility/Utils'
import { borderRadiuses, generateImage, textAligns, textDecorations, textSizes, textStyles, textTransforms } from './ImageGenerator'

const availableCodeSnippets = {
    CHOOSE: (...args: string[]) => {
        if (!args.some(arg => typeof arg !== 'number' || typeof arg !== 'string')) throw new TypeError()
        if (!args.length || args.length <= 1) throw new ReferenceError()

        const random = Math.floor(Math.random() * args.length)
        return args[random]
    },
    DATE: (...args: string[]) => {
        let timestamp = Number(args[0]),
            format = args[1],
            utc = args[2],
            locale = args[3]

        if (typeof timestamp !== 'number' || isNaN(timestamp)) timestamp = Date.now()
        if (typeof format !== 'string') format = 'DD MMM YYYY HH:mm'
        if (!/\+\d{2}:\d{2}/.test(utc)) utc = '+00:00'
        if (typeof locale !== 'string' || !['en', 'ru'].includes(locale)) locale = 'ru'

        return moment(timestamp).locale(locale).utcOffset(utc).format(format)
    },
    DATENOW: () => {
        return Date.now()
    },
    FIXNUM: (...args: string[]) => {
        let number = Number(args[0]),
            digits = Number(args[1])

        if (isNaN(number)) return 0
        if (isNaN(digits) || digits < 0 || digits > 20) digits = 0

        return number.toFixed(digits)
    },
    LOWER: (...args: string[]) => {
        let str = args[0]

        if (typeof str !== 'string') throw new TypeError()

        return str.toLowerCase()
    },
    MATH: (...args: any[]) => {
        let expression = args[0],
            digits = Number(args[1])

        if (typeof expression !== 'string') throw new TypeError()
        if (typeof digits !== 'number' || digits < 0 || digits > 20 || isNaN(digits)) digits = 0

        expression = expression.match(/(?:[0-9\-\+\*\/\^\(\)])+/g) || []

        let result = eval(expression.join(' '))

        if (typeof result !== 'number') result = Number(result)

        return result.toFixed(digits)
    },
    NUMDECL: (...args: string[]) => {
        let number = Number(args[0]),
            titles = args[1]?.split('|'),
            locale = args[2]

        if (typeof number !== 'number' || isNaN(number)) throw new TypeError()
        if (!Array.isArray(titles) || titles.length <= 1) throw new TypeError()
        if (typeof locale !== 'string' || !['ru', 'en'].includes(locale)) locale = 'ru'

        if (locale == 'ru') {
            const cases = [2, 0, 1, 1, 1, 2]

            return titles[number % 100 > 4 && number % 100 < 20 ? 2 : cases[number % 10 < 5 ? number % 10 : 5]]
        }

        if (locale == 'en') {
            return number > 1 ? titles[1] : titles[0]
        }
    },
    RANDOM: (...args: string[]) => {
        let start = Number(args[0]),
            end = Number(args[1])

        if (typeof start !== 'number' || isNaN(start) || start < -Math.pow(2, 53)) start = 0
        if (typeof end !== 'number' || isNaN(end) || end > Math.pow(2, 53)) end = 100

        return `${Math.floor(Math.random() * end) + start}`
    },
    REPLACE: (...args: string[]) => {
        let str = args[0],
            search = args[1],
            replacement = args[2],
            flags = args[3]

        if (typeof str !== 'string' || typeof search !== 'string' || typeof replacement !== 'string') throw new TypeError()
        if (!flags || !flags.split('').some(flag => ['g', 'i'].includes(flag))) flags = 'g'

        const regex = new RegExp(`${search}`, flags)

        return str.replace(regex, replacement)
    },
    TRUNCATE: (...args: string[]) => {
        let str = args[0],
            limit = Number(args[1]),
            end = args[2]

        if (typeof str !== 'string') throw new TypeError()
        if (typeof limit !== 'number') limit = 100
        if (typeof end !== 'string') end = '...'

        if (str.length > limit) return str.substring(0, limit) + end
        else return str
    },
    TRIM: (...args: string[]) => {
        let str = args[0]

        if (typeof str !== 'string') throw new TypeError()

        return str.replace(/\s+/g, ' ').trim()
    },
    UPPER: (...args: string[]) => {
        let str = args[0]

        if (typeof str !== 'string') throw new TypeError()

        return str.toUpperCase()
    }
}

export default class Replacer {
    public premium: boolean
    public shapers: IReplacerShapers

    constructor(premium: boolean, shapers?: IReplacerShapers) {
        this.premium = premium
        this.shapers = shapers
    }

    /**
     * Get all values enclosed in {...} from the string.
     */
    getReplacers(string: string): string[] {
        return (string.match(/{(?!-)\s*[^{}]+\s*}/gi) || []).map((replacer: string) => replacer.replace(/{|}/g, '').trim())
    }

    /**
     * Get all values enclosed in {-...-} from the string.
     */
    getCodeSnippets(string: string) {
        return (string.match(/{\-\s*[A-Z]+\([^{}]*\)\s*\-}/g) || [])
            .map((snippet: string) => {
                snippet = snippet.replace(/{-|-}/g, '').trim()
                const name = snippet.match(/^[A-Z]+/).toString(),
                    args = snippet
                        .match(/\([^{}]*\)$/)
                        .toString()
                        .replace(/^\(/, '')
                        .replace(/\)$/, '')

                if (Object.keys(availableCodeSnippets).includes(name)) {
                    return { name: name, args: args, fn: availableCodeSnippets[name] }
                }
            })
            .filter(i => i)
    }

    /**
     * Get an object with replaceable values.
     */
    async getReplacements() {
        const message = this.shapers?.message,
            guild = this.shapers?.guild,
            member = this.shapers?.member

        let memberActivity: { level: IUserLevel; wallet: IUserWallet }, guildOwner: GuildMember

        if (member) {
            const userDoc = await db.users.findOne({ _id: member.id })
            memberActivity = {
                level: userDoc?.activities?.levels?.find?.(i => i.guild_id === guild.id),
                wallet: userDoc?.activities?.wallets?.find?.(i => i.guild_id === guild.id)
            }
        }

        if (guild) {
            guildOwner = await guild.fetchOwner()
        }

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
                created_at: message?.createdTimestamp,
                edited_at: message?.editedTimestamp,
                id: message?.id,
                tts: message?.tts,
                type: message?.type,
                url: message?.url,
                mentions: {
                    members: message?.mentions?.members?.size
                        ? Object.assign(
                              {},
                              ...message.mentions.members.map((m, i, col) => ({
                                  [[...col.keys()].indexOf(i)]: {
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
                                      roles: Object.assign(
                                          {},
                                          ...m.roles.cache.map(r => ({
                                              [r.id]: {
                                                  name: r.name,
                                                  mention: `<@&${r.id}>`,
                                                  id: r.id,
                                                  position: r.rawPosition.toString(),
                                                  color: r.hexColor,
                                                  created_at: r.createdTimestamp
                                              }
                                          }))
                                      )
                                  }
                              }))
                          )
                        : {},
                    roles: message?.mentions?.roles?.size
                        ? Object.assign(
                              {},
                              ...message.mentions.roles.map((m, i, col) => ({
                                  [[...col.keys()].indexOf(i)]: {
                                      mention: `<@&${m.id}>`,
                                      name: m.name,
                                      id: m.id,
                                      position: m.rawPosition.toString(),
                                      color: m.hexColor,
                                      created_at: m.createdTimestamp
                                  }
                              }))
                          )
                        : {},
                    channels: message?.mentions?.channels?.size
                        ? Object.assign(
                              {},
                              ...message.mentions.channels.map((m, i, col) => ({
                                  [[...col.keys()].indexOf(i)]: {
                                      mention: `<#${m.id}>`,
                                      type: m.type
                                  }
                              }))
                          )
                        : {}
                }
            },
            guild: {
                name: guild?.name,
                acronym: guild?.nameAcronym,
                afk_channel_id: guild?.afkChannelId,
                system_channel_id: guild?.systemChannelId,
                public_updates_channel_id: guild?.publicUpdatesChannelId,
                rules_channel_id: guild?.rulesChannelId,
                banner: guild?.bannerURL?.({ size: 1024, extension: 'png' }),
                channels: {
                    total: guild?.channels?.cache?.size,
                    text: guild?.channels?.cache?.filter?.(i => i.type === ChannelType.GuildText)?.size,
                    voice: guild?.channels?.cache?.filter?.(i => i.type === ChannelType.GuildVoice)?.size,
                    category: guild?.channels?.cache?.filter?.(i => i.type === ChannelType.GuildCategory)?.size
                },
                created_at: guild?.createdTimestamp,
                description: guild?.description,
                icon: guild?.iconURL?.({ size: 512, extension: 'png' }),
                id: guild?.id,
                members: {
                    total: guild?.memberCount,
                    bots: guild?.members?.cache?.filter?.(i => i.user.bot)?.size,
                    users: guild?.members?.cache?.filter?.(i => !i.user.bot)?.size
                },
                owner: {
                    username: guildOwner?.user?.username,
                    avatar: guildOwner?.user?.displayAvatarURL({ size: 512, extension: 'png' }),
                    display_name: guildOwner?.displayName,
                    tag: guildOwner?.user?.tag,
                    mention: `<@${guild?.ownerId ?? '1'}>`,
                    nickname: guildOwner?.nickname
                },
                boosters_count: guild?.premiumSubscriptionCount || 0,
                boost_tier: guild?.premiumTier,
                splash: guild?.splashURL?.({ size: 1024, extension: 'png' }),
                vanity_url: guild?.vanityURLCode ? `https://discord.gg/${guild.vanityURLCode}` : null
            },
            member: {
                username: member?.user?.username,
                avatar: member?.user?.displayAvatarURL?.({ size: 512, extension: 'png' }),
                discriminator: member?.user?.discriminator,
                display_name: member?.displayName,
                id: member?.id,
                tag: member?.user?.tag,
                bot: member?.user?.bot,
                mention: `<@${member?.id}>`,
                created_at: member?.user?.createdTimestamp,
                joined_at: member?.joinedTimestamp,
                nickname: member?.nickname,
                premium_since: member?.premiumSinceTimestamp,
                level: {
                    rank: memberActivity?.level?.experience?.level ?? 0,
                    current_xp: memberActivity?.level?.experience?.current ?? 0,
                    remaining_xp: memberActivity?.level
                        ? Math.round(
                              150 +
                                  memberActivity.level.experience.level * memberActivity.level.experience.level * 8 -
                                  memberActivity.level.experience.current
                          )
                        : 0,
                    need_xp: memberActivity?.level ? 150 + memberActivity.level.experience.level * memberActivity.level.experience.level * 8 : 0,
                    total_xp: memberActivity?.level?.experience?.total ?? 0,
                    total_messages: memberActivity?.level?.activity?.total_messages ?? 0,
                    voice_time: memberActivity?.level?.activity?.total_voice_time ?? 0
                },
                wallet: Object.assign(
                    {},
                    {
                        ...(memberActivity?.wallet?.currencies
                            ?.reduce?.((x, y) => {
                                return y.id === 'DEFAULT' ? [y, ...x] : [...x, y]
                            }, [])
                            ?.map?.(i => i.amount) ?? [0])
                    }
                ),
                voice: {
                    name: member?.voice?.channel?.name,
                    id: member?.voice?.channelId,
                    mention: member?.voice?.channelId ? `<#${member.voice.channelId}>` : null,
                    full: member?.voice?.channel?.full,
                    position: member?.voice?.channel?.rawPosition?.toString?.()
                },
                roles: member?.roles?.cache?.size
                    ? Object.assign(
                          {},
                          ...member.roles.cache.map(r => ({
                              [r.id]: {
                                  name: r.name,
                                  mention: `<@&${r.id}>`,
                                  id: r.id,
                                  position: r.rawPosition.toString(),
                                  color: r.hexColor,
                                  created_at: r.createdTimestamp
                              }
                          }))
                      )
                    : {}
            }
        }
    }

    /**
     * Replace replacers and code snippets in the string.
     */
    async replace(string: string, customReplacements: IReplacerCustomShapers = {}) {
        const replacers = this.getReplacers(string),
            replacements = { ...(await this.getReplacements()), ...customReplacements }

        for (const replacer of replacers) {
            const regexp = new RegExp(`{\\s*${escapeRegexp(replacer)}\\s*}`, 'g')
            const raws = replacer.split(/\s+\|\s+/)

            for (const replacement of raws) {
                const i = raws.indexOf(replacement)
                let value = resolveObjectPath(replacement, replacements)

                if (typeof value === 'object' && value != null) {
                    value = resolveObjectPath(`${replacement}.${Object.keys(value)[0]}`, replacements)
                }

                if (/".+"/.test(replacement)) raws[i] = replacement.substring(1, replacement.length - 1)
                else raws[i] = value
            }

            string = string.replace(regexp, () => raws.find(i => i))
        }

        const codeSnippets = this.getCodeSnippets(string)

        for (const snippet of codeSnippets) {
            const regex = new RegExp(`{-\\s*${escapeRegexp(snippet.name)}\([^{}]*\)\\s*-}`, 'g')

            let res: string

            try {
                res = snippet.fn(...snippet.args.split(/;\s{0,1}/))
            } catch (err) {
                res = `\`${snippet.name}#${err.name}\``
            }

            string = string.replace(regex, () => res)
        }

        return string
    }

    /**
     * Replace replacers and code snippets in the template message and return message payload with content and embeds.
     */
    async replaceTemplateMessage(
        template: { content: string; embed?: IMessageEmbed; image?: MessageImage },
        customReplacements: IReplacerCustomShapers = {}
    ) {
        const content = await this.replace(template.content, customReplacements)
        let embed = {},
            attachment: { buffer: Buffer; name: string }

        if (template.embed && template.embed.active) {
            const imageURL = template.embed.image.url ? await this.replace(template.embed.image.url, customReplacements) : null,
                footerIconURL = template.embed.footer.icon_url ? await this.replace(template.embed.footer.icon_url, customReplacements) : null,
                thumbnailURL = template.embed.thumbnail.url ? await this.replace(template.embed.thumbnail.url, customReplacements) : null,
                avatarIconURL = template.embed.author.icon_url ? await this.replace(template.embed.author.icon_url, customReplacements) : null

            embed = {
                title: template.embed.title ? await this.replace(template.embed.title, customReplacements) : null,
                description: template.embed.description ? await this.replace(template.embed.description, customReplacements) : null,
                url: template.embed.url ? await this.replace(template.embed.url, customReplacements) : null,
                timestamp: template.embed.timestamp ? Number(await this.replace(template.embed.timestamp, customReplacements)) : null,
                color: template.embed.color ? resolveColor(template.embed.color as any) : null,
                footer: {
                    text: template.embed.footer.text ? await this.replace(template.embed.footer.text, customReplacements) : null,
                    icon_url: footerIconURL
                },
                image: imageURL ? { url: imageURL } : null,
                thumbnail: thumbnailURL ? { url: thumbnailURL } : null,
                author: {
                    name: template.embed.author.name ? await this.replace(template.embed.author.name, customReplacements) : null,
                    url: template.embed.author.url ? await this.replace(template.embed.author.url, customReplacements) : null,
                    icon_url: avatarIconURL
                },
                fields: template.embed.fields.length
                    ? await Promise.all(
                          template.embed.fields.map(async field => {
                              return {
                                  name: field.name ? await this.replace(field.name, customReplacements) : null,
                                  value: field.value ? await this.replace(field.value, customReplacements) : null,
                                  inline: Boolean(field.inline)
                              }
                          })
                      )
                    : []
            }
        }

        if (template.image && template.image.active) {
            const tImage = template.image
            const image = {
                height: typeof tImage.height === 'number' && tImage.height <= 1920 && tImage.height >= 256 ? tImage.height : 256,
                width: typeof tImage.width === 'number' && tImage.width <= 1920 && tImage.width >= 256 ? tImage.width : 720,
                background: {
                    color: tImage.background.color,
                    url: tImage.background.url ? await this.replace(tImage.background.url, customReplacements) : null
                },
                elements: tImage.elements.length
                    ? await Promise.all(
                          tImage.elements.slice(0, this.premium ? 50 : 5).map(async v => {
                              const element = {
                                  type: v.type,
                                  posX: typeof v.posX === 'number' && v.posX <= 9999 && v.posX >= -9999 ? v.posX : 0,
                                  posY: typeof v.posY === 'number' && v.posY <= 9999 && v.posY >= -9999 ? v.posY : 0,
                                  height: typeof v.height === 'number' && v.height <= 9999 && v.height >= -9999 ? v.height : 50,
                                  width: typeof v.width === 'number' && v.width <= 9999 && v.width >= -9999 ? v.width : 50
                              }

                              if (v.type === 'IMAGE') {
                                  element['url'] = v.url ? await this.replace(v.url, customReplacements) : null
                                  element['border_radius'] = Object.keys(borderRadiuses).includes(v.border_radius) ? v.border_radius : 'none'
                              } else if (v.type === 'TEXT') {
                                  element['value'] = typeof v.value === 'string' ? await this.replace(v.value, customReplacements) : 'Text'
                                  element['color'] = v.color ?? 'rgba(255,255,255,1)'
                                  element['size'] = Object.keys(textSizes).includes(v.size) ? v.size : 'body2'
                                  element['style'] = textStyles.includes(v.style) ? v.style : 'normal'
                                  element['transform'] = textTransforms.includes(v.transform) ? v.transform : 'none'
                                  element['decoration'] = textDecorations.includes(v.decoration) ? v.decoration : 'none'
                                  element['align'] = textAligns.includes(v.align) ? v.align : 'center'
                              }

                              return element
                          })
                      )
                    : []
            } as MessageImage

            attachment = await generateImage(image)
        }

        const returning = {} as { content: string; embeds?: EmbedBuilder[]; files?: AttachmentBuilder[] }

        if (content) returning['content'] = content
        if (template.embed && template.embed.active) returning['embeds'] = [new EmbedBuilder(embed)]
        if (attachment) returning['files'] = [new AttachmentBuilder(attachment.buffer, { name: attachment.name })]

        return returning
    }
}

export interface IReplacerShapers {
    guild: Guild
    member: GuildMember
    message?: Message
}

export interface IReplacerCustomShapers {
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
