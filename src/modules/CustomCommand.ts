import { chunkArray } from 'discord-hybrid-sharding'
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    BaseGuildTextChannel,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    GuildMember,
    GuildMemberRoleManager,
    InteractionDeferReplyOptions,
    InteractionReplyOptions,
    resolveColor,
    Team,
    User
} from 'discord.js'
import IVM, { Context } from 'isolated-vm'
import { QuickDB } from 'quick.db'
import safeRegex from 'safe-regex'
import { ICustomCommand, MessageEmbed as IMessageEmbed, ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import logger from '../internals/Logger'
import { escapeRegexp, isValidHttpUrl } from '../internals/utility/Utils'

export default class CustomCommand {
    public command: ICustomCommand
    public self: Lacuna
    public server: ServerDocument
    public interaction: ChatInputCommandInteraction
    public storage: QuickDB
    private usedPatterns: string[]
    private usedFunctions: string[]
    private isolate: IVM.Isolate

    constructor(command: ICustomCommand, self: Lacuna, server: ServerDocument, interaction: ChatInputCommandInteraction) {
        this.command = command

        this.self = self

        this.server = server

        this.interaction = interaction

        this.storage = this.self.db.qdb.table('publicStorage')

        this.usedPatterns = []

        this.usedFunctions = []

        this.isolate = new IVM.Isolate({
            memoryLimit: 16,
            onCatastrophicError(message) {
                logger.error('(Catastrophic Error):', message)
                logger.telegram.error('Catastrophic Error:', message)
            }
        })
    }

    async getGlobalValues() {
        let { channel, commandId, commandName, guild, member, options } = this.interaction

        await channel.fetch()
        await guild.fetch()

        return {
            channel: {
                id: channel.id,
                name: channel['name'],
                type: channel.type,
                parentId: channel['parentId'],
                nsfw: channel['nsfw'],
                position: channel['rawPosition'],
                topic: channel['topic'],
                lastMessageId: channel.lastMessageId,
                rateLimitPerUser: channel['rateLimitPerUser'],
                createdTimestamp: channel.createdTimestamp
            },
            command: {
                id: commandId,
                name: commandName,
                options: options.data.map(i => {
                    let user, channel, role

                    if (i.type === ApplicationCommandOptionType.User) user = options.getUser(i.name)
                    if (i.type === ApplicationCommandOptionType.Channel) channel = options.getChannel(i.name)
                    if (i.type === ApplicationCommandOptionType.Role) role = options.getRole(i.name)

                    return {
                        name: i.name,
                        value: i.value,
                        user: user
                            ? {
                                  id: user.id,
                                  username: user.username,
                                  discriminator: user.discriminator,
                                  avatar: user.displayAvatarURL(),
                                  createdTimestamp: user.createdTimestamp
                              }
                            : undefined,
                        channel: channel
                            ? {
                                  id: channel.id,
                                  name: channel.name,
                                  type: channel.type,
                                  parentId: channel.parentId,
                                  nsfw: channel.nsfw,
                                  position: channel.rawPosition,
                                  topic: channel.topic,
                                  lastMessageId: channel.lastMessageId,
                                  rateLimitPerUser: channel.rateLimitPerUser,
                                  createdTimestamp: channel.createdTimestamp
                              }
                            : undefined,
                        role: role
                            ? {
                                  id: role.id,
                                  name: role.name,
                                  color: role.hexColor,
                                  icon: role.iconURL(),
                                  hoist: role.hoist,
                                  managed: role.managed,
                                  mentionable: role.mentionable,
                                  position: role.rawPosition
                              }
                            : undefined
                    }
                })
            },
            guild: {
                id: guild.id,
                name: guild.name,
                nameAcronym: guild.nameAcronym,
                icon: guild.iconURL(),
                channels: guild.channels.cache.map(i => {
                    return {
                        id: i.id,
                        name: i.name,
                        type: i.type,
                        parentId: i.parentId,
                        nsfw: i['nsfw'],
                        position: i['rawPosition'],
                        topic: i['topic'],
                        lastMessageId: i['lastMessageId'],
                        rateLimitPerUser: i['rateLimitPerUser'],
                        createdTimestamp: i.createdTimestamp
                    }
                }),
                roles: guild.roles.cache.map(i => {
                    return {
                        id: i.id,
                        name: i.name,
                        color: i.hexColor,
                        icon: i.iconURL(),
                        hoist: i.hoist,
                        managed: i.managed,
                        mentionable: i.mentionable,
                        position: i.rawPosition
                    }
                }),
                splash: guild.splashURL(),
                banner: guild.bannerURL(),
                description: guild.description,
                discoverySplash: guild.discoverySplashURL(),
                vanityURLCode: guild.vanityURLCode,
                verificationLevel: guild.verificationLevel,
                nsfwLevel: guild.nsfwLevel,
                mfaLevel: guild.mfaLevel,
                afkTimeout: guild.afkTimeout,
                afkChannelId: guild.afkChannelId,
                rulesChannelId: guild.rulesChannelId,
                systemChannelId: guild.systemChannelId,
                publicUpdatesChannelId: guild.publicUpdatesChannelId,
                premiumTier: guild.premiumTier,
                premiumSubscriptionCount: guild.premiumSubscriptionCount,
                explicitContentFilter: guild.explicitContentFilter,
                defaultMessageNotifications: guild.defaultMessageNotifications,
                ownerId: guild.ownerId,
                createdTimestamp: guild.createdTimestamp,
                economyCurrencies: this.server.modules.economy.currencies.map(i => ({ id: i.id, name: i.name, symbol: i.symbol }))
            },
            member: {
                user: {
                    id: member.user.id,
                    username: member.user.username,
                    discriminator: member.user.discriminator,
                    avatar: (member.user as User).displayAvatarURL(),
                    createdTimestamp: member.user['createdTimestamp']
                },
                avatar: (member as GuildMember).displayAvatarURL(),
                nickname: member['nickname'],
                pending: member.pending,
                roles: (member.roles as GuildMemberRoleManager).cache.map(i => {
                    return {
                        id: i.id,
                        name: i.name,
                        color: i.hexColor,
                        icon: i.iconURL(),
                        hoist: i.hoist,
                        managed: i.managed,
                        mentionable: i.mentionable,
                        position: i.rawPosition
                    }
                }),
                permissions: (member as GuildMember).permissions.toArray(),
                joinedTimestamp: member['joinedTimestamp']
            }
        }
    }

    getPatterns(string: string) {
        return string.match(/{{\s*((.|\n)+?)\s*}}/g)?.map(i => i.slice(2, i.length - 2).trim()) ?? []
    }

    async replacePatterns(string: string, ctx: Context) {
        const patterns = this.getPatterns(string)

        for (let pattern of patterns) {
            const regexp = new RegExp(`{{\\s*${escapeRegexp(pattern)}\\s*}}`, 'g')

            try {
                // Remove unsafe regex
                pattern = pattern
                    .replace(/\/((.|\n)+?)\//g, value => {
                        return safeRegex(value) === true ? value : '/unsafe/'
                    })
                    .replace(/RegExp/gi, '')

                const script = this.isolate.compileScriptSync(pattern)
                const value = await script.run(ctx, { timeout: 2500, promise: true })

                string = string.replace(regexp, () => {
                    return typeof value === 'undefined' ? '' : value
                })
            } catch (err) {
                logger.error(`(Custom Commands): "${err.message}" (${this.interaction.guildId}) (${this.interaction.user.id})`)
            }
        }

        this.usedPatterns.push(...patterns)

        return string
    }

    async handleTemplateMessage(message: { content: string; embed: IMessageEmbed }, ctx: Context) {
        const content = await this.replacePatterns(message.content, ctx)
        let embed = {}

        if (message.embed && message.embed.active) {
            let url = message.embed.url ? await this.replacePatterns(message.embed.url, ctx) : null,
                footer_icon_url = message.embed.footer.icon_url ? await this.replacePatterns(message.embed.footer.icon_url, ctx) : null,
                image_url = message.embed.image.url ? await this.replacePatterns(message.embed.image.url, ctx) : null,
                thumbnail_url = message.embed.thumbnail.url ? await this.replacePatterns(message.embed.thumbnail.url, ctx) : null,
                author_url = message.embed.author.url ? await this.replacePatterns(message.embed.author.url, ctx) : null,
                author_icon_url = message.embed.author.icon_url ? await this.replacePatterns(message.embed.author.icon_url, ctx) : null

            url = isValidHttpUrl(url) ? url : null
            footer_icon_url = isValidHttpUrl(footer_icon_url) ? footer_icon_url : null
            image_url = isValidHttpUrl(image_url) ? image_url : null
            thumbnail_url = isValidHttpUrl(thumbnail_url) ? thumbnail_url : null
            author_url = isValidHttpUrl(author_url) ? author_url : null
            author_icon_url = isValidHttpUrl(author_icon_url) ? author_icon_url : null

            embed = {
                title: message.embed.title ? await this.replacePatterns(message.embed.title, ctx) : null,
                description: message.embed.description ? await this.replacePatterns(message.embed.description, ctx) : null,
                url: url,
                timestamp: message.embed.timestamp ? Number(await this.replacePatterns(message.embed.timestamp, ctx)) : null,
                color: message.embed.color ? resolveColor(message.embed.color as any) : null,
                footer: {
                    text: message.embed.footer.text ? await this.replacePatterns(message.embed.footer.text, ctx) : null,
                    icon_url: footer_icon_url
                },
                image: image_url ? { url: image_url } : null,
                thumbnail: thumbnail_url ? { url: thumbnail_url } : null,
                author: {
                    name: message.embed.author.name ? await this.replacePatterns(message.embed.author.name, ctx) : null,
                    url: author_url,
                    icon_url: author_icon_url
                },
                fields: message.embed.fields.length
                    ? await Promise.all(
                          message.embed.fields
                              .filter(i => typeof i.name === 'string' && i.name.length && typeof i.value === 'string' && i.value.length)
                              .map(async field => {
                                  return {
                                      name: await this.replacePatterns(field.name, ctx),
                                      value: await this.replacePatterns(field.value, ctx),
                                      inline: Boolean(field.inline)
                                  }
                              })
                      )
                    : []
            }
        }

        const returning = {} as { content: string; embeds: EmbedBuilder[] }

        if (content) returning.content = content
        if (message.embed && message.embed.active) returning.embeds = [new EmbedBuilder(embed)]

        return returning
    }

    async execute() {
        const t = this.self.i18n.t.bind(null, this.server.locale)
        const throttled = await this.throttled()

        if (throttled.status) {
            await this.interaction.reply({
                content: `${this.self._emojis.ERROR} | ${t('common.command_throttled', {
                    user: `**${this.interaction.user.username}**`,
                    time: `<t:${Math.round(throttled.retry_after / 1000)}:T>`
                })}`,
                ephemeral: true
            })

            return false
        }

        const ctx = this.isolate.createContextSync()
        ctx.global.setSync('global', ctx.global.derefInto())

        const globalValues = await this.getGlobalValues()

        for (const smartValue of Object.keys(globalValues)) {
            ctx.global.setSync(smartValue, globalValues[smartValue], { copy: true })
        }

        ctx.global.setSync('setValue', (key: string, value: any) => {
            const used = this.useFunction('setValue')

            if (used > 5) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')

            if (typeof key !== 'string' || !key.length) throw new TypeError('INVALID_PARAMETERS')
            if (!value || typeof value === 'function' || value === null) throw new TypeError('INVALID_PARAMETERS')

            this.storage.set(`${this.interaction.guildId}.${key}`, value)
        })

        ctx.evalClosureSync(
            `
            getValue = function(...args) {
                return $0.apply(undefined, args, { arguments: { copy: true }, result: { promise: true, copy: true } })
            }
        `,
            [
                (key: string) => {
                    if (typeof key !== 'string' || !key.length) throw new TypeError('INVALID_PARAMETERS')

                    return this.storage.get(`${this.interaction.guildId}.${key}`)
                }
            ],
            { arguments: { reference: true } }
        )

        ctx.global.setSync('deleteValue', (key: string) => {
            if (typeof key !== 'string' || !key.length) throw new TypeError('INVALID_PARAMETERS')

            this.storage.delete(`${this.interaction.guildId}.${key}`)
        })

        if (this.command.components.length > 1 && this.command.components.some(i => i.action?.type === 'EXECUTE_CODE')) {
            this.command.components = [this.command.components.find(i => i.action?.type === 'EXECUTE_CODE')]
        }

        for (const component of this.command.components) {
            if (component.type === 'CONDITION') {
                const { condition } = component

                if (condition.type === 'COMPARE_VALUES') {
                    const { compare_values } = condition

                    const leftVal = await this.replacePatterns(compare_values.left, ctx)
                    const rightVal = await this.replacePatterns(compare_values.right, ctx)

                    const message =
                        compare_values.options.includes('FALSE_REPLY') && compare_values.false_reply
                            ? await this.handleTemplateMessage(compare_values.false_reply, ctx)
                            : null

                    if (compare_values.operator === 'EQUAL') {
                        if (leftVal !== rightVal) {
                            if (message)
                                await this.interaction
                                    .reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') })
                                    .catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'NOT_EQUAL') {
                        if (leftVal === rightVal) {
                            if (message)
                                await this.interaction
                                    .reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') })
                                    .catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'STARTS_WITH') {
                        if (!leftVal.startsWith(rightVal)) {
                            if (message)
                                await this.interaction
                                    .reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') })
                                    .catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'ENDS_WITH') {
                        if (!leftVal.endsWith(rightVal)) {
                            if (message)
                                await this.interaction
                                    .reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') })
                                    .catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'GREATER_THAN') {
                        if (leftVal < rightVal) {
                            if (message)
                                await this.interaction
                                    .reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') })
                                    .catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'LESS_THAN') {
                        if (leftVal > rightVal) {
                            if (message)
                                await this.interaction
                                    .reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') })
                                    .catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'CONTAINS') {
                        if (!leftVal.includes(rightVal)) {
                            if (message)
                                await this.interaction
                                    .reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') })
                                    .catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'NOT_CONTAINS') {
                        if (leftVal.includes(rightVal)) {
                            if (message)
                                await this.interaction
                                    .reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') })
                                    .catch(() => {})

                            break
                        }
                    }
                }
            }

            if (component.type === 'ACTION') {
                const { action } = component

                if (action.type === 'EXECUTE_CODE' && this.server.server.premium.available) {
                    const functions = {
                        deferReply: async (rawOptions: InteractionDeferReplyOptions) => {
                            const used = this.useFunction('deferReply')

                            if (used > 1) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')

                            const options = {
                                ephemeral: Boolean(rawOptions?.ephemeral)
                            }

                            await this.interaction.deferReply(options)
                        },
                        deleteReply: async () => {
                            const used = this.useFunction('deleteReply')

                            if (used > 1) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')

                            await this.interaction.deleteReply()
                        },
                        editReply: async (rawOptions: InteractionReplyOptions) => {
                            const used = this.useFunction('editReply')

                            if (used > 3) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')

                            const components = rawOptions?.components?.length
                                ? chunkArray(
                                      (rawOptions.components as any[]).filter(i => i.type === 'Button' && i.style === 'Link'),
                                      5
                                  )
                                : []
                            const options = {
                                content: rawOptions?.content ?? undefined,
                                embeds: rawOptions?.embeds?.length
                                    ? rawOptions.embeds.map(i => {
                                          return new EmbedBuilder(i as any).toJSON()
                                      })
                                    : undefined,
                                components: components.length
                                    ? components.slice(0, 5).map(i => {
                                          return new ActionRowBuilder<ButtonBuilder>()
                                              .addComponents(
                                                  i.map(ii => {
                                                      return new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(ii.label).setURL(ii.url)
                                                  })
                                              )
                                              .toJSON()
                                      })
                                    : undefined,
                                tts: Boolean(rawOptions?.tts),
                                ephemeral: Boolean(rawOptions?.ephemeral)
                            }

                            await this.interaction.editReply(options)
                        },
                        followUpReply: async (rawOptions: InteractionReplyOptions) => {
                            const used = this.useFunction('followUpReply')

                            if (used > 3) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')

                            const components = rawOptions?.components?.length
                                ? chunkArray(
                                      (rawOptions.components as any[]).filter(i => i.type === 'Button' && i.style === 'Link'),
                                      5
                                  )
                                : []
                            const options = {
                                content: rawOptions?.content ?? undefined,
                                embeds: rawOptions?.embeds?.length
                                    ? rawOptions.embeds.map(i => {
                                          return new EmbedBuilder(i as any).toJSON()
                                      })
                                    : undefined,
                                components: components.length
                                    ? components.slice(0, 5).map(i => {
                                          return new ActionRowBuilder<ButtonBuilder>()
                                              .addComponents(
                                                  i.map(ii => {
                                                      return new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(ii.label).setURL(ii.url)
                                                  })
                                              )
                                              .toJSON()
                                      })
                                    : undefined,
                                tts: Boolean(rawOptions?.tts),
                                ephemeral: Boolean(rawOptions?.ephemeral)
                            }

                            await this.interaction.followUp(options)
                        },
                        getUserActivity: async (userId: string) => {
                            const used = this.useFunction('getUserActivity')

                            if (used > 3) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (typeof userId !== 'string') throw new TypeError('INVALID_ARGUMENTS')

                            const user = await this.self.db.users.findOne({ _id: userId })
                            const userActivities = {
                                level: user?.activities?.levels?.find?.(i => i.guild_id === this.interaction.guildId),
                                wallet: user?.activities?.wallets?.find?.(i => i.guild_id === this.interaction.guildId)
                            }

                            return {
                                level: {
                                    rank: userActivities?.level?.experience?.level ?? 0,
                                    current_xp: userActivities?.level?.experience?.current ?? 0,
                                    total_xp: userActivities?.level?.experience?.total ?? 0,
                                    total_messages: userActivities?.level?.activity?.total_messages ?? 0,
                                    voice_time: userActivities?.level?.activity?.total_voice_time ?? 0
                                },
                                wallet: userActivities?.wallet?.currencies
                                    ?.reduce((x, y) => {
                                        return y.id === 'DEFAULT' ? [y, ...x] : [...x, y]
                                    }, [])
                                    ?.map(i => i.amount) ?? [0]
                            }
                        },
                        reply: async (rawOptions: InteractionReplyOptions) => {
                            const used = this.useFunction('reply')

                            if (used > 1) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')

                            const components = rawOptions?.components?.length
                                ? chunkArray(
                                      (rawOptions.components as any[]).filter(i => i.type === 'Button' && i.style === 'Link'),
                                      5
                                  )
                                : []
                            const options = {
                                content: rawOptions?.content ?? undefined,
                                embeds: rawOptions?.embeds?.length
                                    ? rawOptions.embeds.map(i => {
                                          return new EmbedBuilder(i as any).toJSON()
                                      })
                                    : undefined,
                                components: components.length
                                    ? components.slice(0, 5).map(i => {
                                          return new ActionRowBuilder<ButtonBuilder>()
                                              .addComponents(
                                                  i.map(ii => {
                                                      return new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(ii.label).setURL(ii.url)
                                                  })
                                              )
                                              .toJSON()
                                      })
                                    : undefined,
                                tts: Boolean(rawOptions?.tts),
                                ephemeral: Boolean(rawOptions?.ephemeral)
                            }

                            await this.interaction.reply(options)
                        },
                        modifyUserRoles: async (userId: string, roles: string[], mode: 'add' | 'remove' | 'set' = 'add') => {
                            const used = this.useFunction('modifyUserRoles')

                            if (used > 1) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (typeof userId !== 'string' || !Array.isArray(roles) || !roles.every(i => typeof i === 'string'))
                                throw new TypeError('INVALID_ARGUMENTS')

                            const member = await this.interaction.guild.members.fetch({ user: userId })

                            if (mode === 'add') {
                                await member.roles.add(roles)
                            }

                            if (mode === 'remove') {
                                await member.roles.remove(roles)
                            }

                            if (mode === 'set') {
                                await member.roles.set(roles)
                            }
                        },
                        modifyUserWallet: async (userId: string, amount: number, currencyId: string = 'DEFAULT') => {
                            const used = this.useFunction('modifyUserWallet')

                            if (used > 2) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (typeof userId !== 'string' || typeof amount !== 'number' || (currencyId && typeof currencyId !== 'string'))
                                throw new TypeError('INVALID_ARGUMENTS')
                            if (!this.server.modules.economy.active) throw new Error('ECONOMY_IS_DISABLED')

                            const member = await this.interaction.guild.members.fetch({ user: userId })
                            let currency = this.server.modules.economy.currencies.find(i => i.id === currencyId)

                            if (!currency) {
                                currency = this.server.modules.economy.currencies.find(i => i.id === 'DEFAULT')
                            }

                            const INT32_MAX = Math.pow(2, 31) - 1
                            amount = isNaN(amount) ? 0 : amount

                            if (amount > INT32_MAX || amount < -INT32_MAX)
                                amount = amount > INT32_MAX ? INT32_MAX : amount < -INT32_MAX ? -INT32_MAX : 0

                            let user = await this.self.db.users.findOne({ _id: member.id })

                            if (!user) {
                                user = await this.self.db.users.create({
                                    _id: member.id,
                                    user: {
                                        username: member.user.username,
                                        discriminator: member.user.discriminator,
                                        avatar: member.user.avatar,
                                        flags: member.user.flags?.bitfield ?? 0
                                    }
                                } as any)
                            }

                            let wallet = user.activities.wallets.find(i => i.guild_id == this.interaction.guildId)

                            if (!wallet) {
                                wallet = {
                                    guild_id: this.interaction.guildId,
                                    currencies: [],
                                    transactions: [],
                                    activity: {
                                        last_message_at: 0,
                                        voice_connected_at: 0
                                    }
                                }

                                await this.self.db.users.updateOne(
                                    { _id: member.id },
                                    {
                                        $push: { 'activities.wallets': wallet as never }
                                    }
                                )
                            }

                            const walletCurrency = wallet.currencies.find(i => i.id === currency.id)

                            if (walletCurrency?.amount - Math.abs(amount) < 0) throw new Error('CURRENCY_AMOUNT_CANNOT_BE_NEGATIVE')

                            if (walletCurrency) {
                                await this.self.db.users.updateOne(
                                    {
                                        _id: member.id,
                                        'activities.wallets': { $elemMatch: { guild_id: this.interaction.guildId, 'currencies.id': currency.id } }
                                    },
                                    {
                                        $inc: {
                                            'activities.wallets.$[guild].currencies.$[currency].amount': amount
                                        }
                                    },
                                    { arrayFilters: [{ 'guild.guild_id': this.interaction.guildId }, { 'currency.id': currency.id }] }
                                )
                            } else {
                                await this.self.db.users.updateOne(
                                    { _id: member.id, 'activities.wallets.guild_id': this.interaction.guildId },
                                    {
                                        $push: {
                                            'activities.wallets.$.currencies': {
                                                id: currency.id,
                                                amount: amount
                                            }
                                        }
                                    }
                                )
                            }
                        },
                        sendMessage: async (channelId: string, rawOptions: InteractionReplyOptions) => {
                            const used = this.useFunction('sendMessage')

                            if (used > 2) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (typeof channelId !== 'string') throw new TypeError('INVALID_ARGUMENTS')

                            const channel = this.interaction.guild.channels.cache.get(channelId) as BaseGuildTextChannel

                            if (!channel) throw new Error('UNKNOWN_CHANNEL')

                            const components = rawOptions?.components?.length
                                ? chunkArray(
                                      (rawOptions.components as any[]).filter(i => i.type === 'Button' && i.style === 'Link'),
                                      5
                                  )
                                : []
                            const options = {
                                content: rawOptions?.content ?? null,
                                embeds: rawOptions?.embeds?.length
                                    ? rawOptions.embeds.map(i => {
                                          return new EmbedBuilder(i as any).toJSON()
                                      })
                                    : [],
                                components: components.slice(0, 5).map(i => {
                                    return new ActionRowBuilder<ButtonBuilder>()
                                        .addComponents(
                                            i.map(ii => {
                                                return new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(ii.label).setURL(ii.url)
                                            })
                                        )
                                        .toJSON()
                                })
                            }

                            const message = await channel.send(options)

                            return {
                                channel: {
                                    id: channel.id,
                                    name: channel.name,
                                    type: channel.type,
                                    parentId: channel.parentId,
                                    nsfw: channel.nsfw,
                                    position: channel.rawPosition,
                                    topic: channel.topic,
                                    lastMessageId: channel.lastMessageId,
                                    rateLimitPerUser: channel.rateLimitPerUser,
                                    createdTimestamp: channel.createdTimestamp
                                },
                                createdTimestamp: message.createdTimestamp,
                                crosspostable: message.crosspostable,
                                editedTimestamp: message.editedTimestamp,
                                id: message.id,
                                pinnable: message.pinnable,
                                url: message.url
                            }
                        }
                    }

                    ctx.evalClosureSync(
                        Object.keys(functions)
                            .map((i, idx) => {
                                return `
                                    ${i} = function(...args) {
                                        return $${idx}.apply(undefined, args, { arguments: { copy: true }, result: { promise: true, copy: true } })
                                    }
                                `
                            })
                            .join(';'),
                        Object.values(functions),
                        { arguments: { reference: true } }
                    )

                    const { execute_code } = action

                    try {
                        const code = execute_code.code.slice(0, 4000)

                        const script = await this.isolate.compileScript(`(async () => { ${code} })()`)
                        await script.run(ctx, { timeout: 7500, promise: true })
                        this.usedPatterns.push(code)
                    } catch (err) {
                        const error = err.toString().replace(/<isolated-vm>:?/, '')

                        if (!this.interaction.replied) {
                            await this.interaction.reply({
                                embeds: [new EmbedBuilder().setDescription(error).setColor('Red')]
                            })
                        }
                    }

                    break
                }

                if (action.type === 'REPLY') {
                    const index = this.command.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { reply } = action

                    if (index > 0) continue

                    const message = await this.handleTemplateMessage(reply.message, ctx)

                    await this.interaction.reply({ ...message, ephemeral: reply.options.includes('EPHEMERAL') }).catch(() => {})
                }

                if (action.type === 'SEND_MESSAGE') {
                    const index = this.command.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { send_message } = action

                    if (index > 1) continue

                    const message = await this.handleTemplateMessage(send_message.message, ctx)

                    if (send_message.format === 'CHANNEL') {
                        const channel = this.interaction.guild.channels.cache.get(send_message.channel_id) as BaseGuildTextChannel

                        if (channel) await channel.send({ ...message, tts: send_message.options.includes('TTS') }).catch(() => {})
                    }

                    if (send_message.format === 'CURRENT_CHANNEL') {
                        await this.interaction.channel.send({ ...message, tts: send_message.options.includes('TTS') }).catch(() => {})
                    }
                }

                if (action.type === 'MODIFY_ROLES') {
                    const index = this.command.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { modify_roles } = action

                    if (index > 1) continue

                    const user_id = modify_roles.user_id ? await this.replacePatterns(modify_roles.user_id, ctx) : this.interaction.user.id
                    const member = (await this.interaction.guild.members.fetch(user_id).catch(() => {})) as GuildMember

                    if (member) {
                        if (modify_roles.add.length) {
                            const roles = this.interaction.guild.roles.cache.filter(i => i.editable && modify_roles.add.includes(i.id))

                            if (roles.size) await member.roles.add(roles).catch(() => {})
                        }

                        if (modify_roles.remove.length) {
                            const roles = this.interaction.guild.roles.cache.filter(i => i.editable && modify_roles.remove.includes(i.id))

                            if (roles.size) await member.roles.remove(roles).catch(() => {})
                        }
                    }
                }

                if (action.type === 'FORWARD_TO_COMMAND') {
                    const index = this.command.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { forward_to_command } = action

                    if (index > 0) continue

                    const command = this.self.commands.find(i => i.is_slash_command && i.name === forward_to_command)

                    if (command) await command.executeSlash(this.server, this.interaction)
                }

                if (action.type === 'MODIFY_WALLET') {
                    const index = this.command.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { modify_wallet } = action

                    if (index > 1) continue
                    if (!this.server.modules.economy.active) continue

                    const user_id = modify_wallet.user_id ? await this.replacePatterns(modify_wallet.user_id, ctx) : this.interaction.user.id
                    const member = (await this.interaction.guild.members.fetch(user_id).catch(() => {})) as GuildMember

                    if (member) {
                        const currency_id = modify_wallet.currency_id ? await this.replacePatterns(modify_wallet.currency_id, ctx) : 'DEFAULT'
                        let currency = this.server.modules.economy.currencies.find(i => i.id === currency_id)

                        if (!currency) {
                            currency = this.server.modules.economy.currencies.find(i => i.id === 'DEFAULT')
                        }

                        const INT32_MAX = Math.pow(2, 31) - 1
                        let amount = modify_wallet.amount ? await this.replacePatterns(modify_wallet.amount, ctx) : 0
                        amount = isNaN(Number(amount)) ? 0 : Number(amount)

                        if (amount > INT32_MAX || amount < -INT32_MAX) amount = amount > INT32_MAX ? INT32_MAX : amount < -INT32_MAX ? -INT32_MAX : 0

                        let user = await this.self.db.users.findOne({ _id: member.id })

                        if (!user) {
                            user = await this.self.db.users.create({
                                _id: member.id,
                                user: {
                                    username: member.user.username,
                                    discriminator: member.user.discriminator,
                                    avatar: member.user.avatar,
                                    flags: member.user.flags?.bitfield ?? 0
                                }
                            } as any)
                        }

                        let wallet = user.activities.wallets.find(i => i.guild_id == this.interaction.guildId)

                        if (!wallet) {
                            wallet = {
                                guild_id: this.interaction.guildId,
                                currencies: [],
                                transactions: [],
                                activity: {
                                    last_message_at: 0,
                                    voice_connected_at: 0
                                }
                            }

                            await this.self.db.users.updateOne(
                                { _id: member.id },
                                {
                                    $push: { 'activities.wallets': wallet as never }
                                }
                            )
                        }

                        if (wallet.currencies.some(c => c.id === currency_id)) {
                            await this.self.db.users.updateOne(
                                {
                                    _id: member.id,
                                    'activities.wallets': { $elemMatch: { guild_id: this.interaction.guildId, 'currencies.id': currency_id } }
                                },
                                {
                                    $inc: {
                                        'activities.wallets.$[guild].currencies.$[currency].amount': amount
                                    }
                                },
                                { arrayFilters: [{ 'guild.guild_id': this.interaction.guildId }, { 'currency.id': currency_id }] }
                            )
                        } else {
                            await this.self.db.users.updateOne(
                                { _id: member.id, 'activities.wallets.guild_id': this.interaction.guildId },
                                {
                                    $push: {
                                        'activities.wallets.$.currencies': {
                                            id: currency_id,
                                            amount: amount
                                        }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }

        await this.throttle()

        this.self.logger.telegram.info(
            `Code Snippets (${this.interaction.guildId}:${this.interaction.user.id}):\n\`\`\`\n${this.usedPatterns.join('\n\n')}\n\`\`\``
        )
        this.self.emit('commandExecution', {
            command: this.interaction.commandName,
            options: this.interaction.options.data.map(i => ({ name: i.name, type: i.type, value: i.value ?? null })),
            guild: { name: this.interaction.guild.name, id: this.interaction.guildId },
            channel: { name: (this.interaction.channel as BaseGuildTextChannel)?.name, id: this.interaction.channelId },
            user: { name: this.interaction.user.username, id: this.interaction.user.id }
        })

        if (!this.isolate.isDisposed) this.isolate.dispose()

        return true
    }

    async throttled() {
        if (this.command.options.includes('THROTTLING')) {
            let path = `${this.interaction.guildId}.users.${this.interaction.user.id}`

            if (this.command.throttling?.type === 'PER_GUILD') {
                path = `${this.interaction.guildId}.guild`
            }

            if (this.command.throttling?.type === 'PER_CHANNEL') {
                path = `${this.interaction.guildId}.channels.${this.interaction.channelId}`
            }

            const throttled = (await this.self.db.qdb.get(`throttling.customCommands.${this.command.id}.${path}`)) as any

            if (throttled?.retry_after - Date.now() > 0) {
                return {
                    status: true,
                    retry_after: throttled.retry_after
                }
            }

            if (throttled?.remaining === -1) {
                await this.self.db.qdb.delete(`throttling.customCommands.${this.command.id}.${path}`)
            }

            return {
                status: false
            }
        }

        return {
            status: false
        }
    }

    async throttle() {
        if ((this.self.application.owner as Team).members.some(m => m.id === this.interaction.user.id)) return false

        if (this.command.options.includes('THROTTLING')) {
            let path = `${this.interaction.guildId}.users.${this.interaction.user.id}`

            if (this.command.throttling?.type === 'PER_GUILD') {
                path = `${this.interaction.guildId}.guild`
            }

            if (this.command.throttling?.type === 'PER_CHANNEL') {
                path = `${this.interaction.guildId}.channels.${this.interaction.channelId}`
            }

            let throttled = (await this.self.db.qdb.get(`throttling.customCommands.${this.command.id}.${path}`)) as any
            if (!throttled) {
                await this.self.db.qdb.set(`throttling.customCommands.${this.command.id}.${path}`, {
                    retry_after: Date.now(),
                    remaining: this.command.throttling.max_uses
                })

                throttled = (await this.self.db.qdb.get(`throttling.customCommands.${this.command.id}.${path}`)) as any
            }

            this.self.db.qdb.sub(`throttling.customCommands.${this.command.id}.${path}.remaining`, 1)
            throttled.remaining--

            if (throttled.remaining <= 0) {
                await this.self.db.qdb.set(
                    `throttling.customCommands.${this.command.id}.${path}.retry_after`,
                    Date.now() + this.command.throttling.timeout * 1000
                )
                await this.self.db.qdb.set(`throttling.customCommands.${this.command.id}.${path}.remaining`, -1)
            }
        } else {
            const has = await this.self.db.qdb.has(`throttling.customCommands.${this.command.id}.${this.interaction.guildId}`)

            if (has) {
                await this.self.db.qdb.delete(`throttling.customCommands.${this.command.id}.${this.interaction.guildId}`)
            }
        }
    }

    useFunction(name: string) {
        this.usedFunctions.push(name)
        return this.usedFunctions.filter(i => i === name).length
    }
}
