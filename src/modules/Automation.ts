import {
    ServerDocument,
    ServerMessageTemplateEmbed,
    ServerModulesAutomation,
    ServerModulesAutomationTrigger
} from '@lacunahub/lacuna-database-driver'
import {
    AnySelectMenuInteraction,
    BaseGuildTextChannel,
    ButtonInteraction,
    ChannelType,
    Collection,
    EmbedBuilder,
    Guild,
    GuildChannelCreateOptions,
    GuildMember,
    InteractionDeferReplyOptions,
    InteractionEditReplyOptions,
    InteractionReplyOptions,
    Message,
    ModalComponentData,
    ModalSubmitInteraction,
    StartThreadOptions,
    StringSelectMenuInteraction,
    ThreadChannel,
    VoiceState,
    resolveColor
} from 'discord.js'
import { Context, Isolate } from 'isolated-vm'
import { Database as QDatabase } from 'quickmongo'
import safeRegex from 'safe-regex'
import Lacuna from '../internals/Lacuna'
import Logger from '../internals/Logger'
import {
    escapeRegexp,
    isValidHttpUrl,
    snakeToPascalCase,
    transformMessageComponents,
    transformMessageEmbeds,
    transformModalComponents
} from '../internals/utility/Utils'

export default class Automation {
    public self: Lacuna
    public server: ServerDocument
    public automation: ServerModulesAutomation
    public signal: AutomationSignal
    private storage: QDatabase
    private isolate: Isolate
    private usedPatterns: string[]
    private usedFunctions: string[]

    constructor(self: Lacuna, server: ServerDocument, automation: ServerModulesAutomation, signal: AutomationSignal) {
        this.self = self

        this.server = server

        this.automation = automation

        this.signal = signal

        this.storage = new this.self.db.qdb.table('public-storage')

        const isolateState =
            this.self.isolates.get(signal.guild.id) ??
            this.self.isolates
                .set(signal.guild.id, {
                    value: new Isolate({
                        memoryLimit: 8,
                        onCatastrophicError(message) {
                            Logger.error('(Catastrophic Error):', message)
                            Logger.telegram.error('Catastrophic Error:', message)
                        }
                    }),
                    lastUsed: Date.now()
                })
                .get(signal.guild.id)

        isolateState.lastUsed = Date.now()
        this.isolate = isolateState.value

        this.usedPatterns = []

        this.usedFunctions = []
    }

    get signalType() {
        let type = 'Unknown'

        if (this.signal instanceof GuildMember) type = 'GuildMember'
        if (this.signal instanceof ButtonInteraction) type = 'ButtonInteraction'
        if (this.signal instanceof StringSelectMenuInteraction) type = 'StringSelectMenuInteraction'
        if (this.signal instanceof ModalSubmitInteraction) type = 'ModalSubmitInteraction'
        if (this.signal instanceof Message) type = 'Message'
        if (this.signal instanceof VoiceState) type = 'VoiceState'

        return type
    }

    async getGlobalValues() {
        let guild: Guild,
            member: GuildMember,
            channel: BaseGuildTextChannel,
            interaction: ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction,
            message: Message,
            voiceState: VoiceState

        guild = this.signal.guild

        if (this.signalType === 'GuildMember') {
            member = this.signal as GuildMember
        } else {
            member = this.signal['member']
            channel = this.signal['channel']
        }

        if (['ButtonInteraction', 'StringSelectMenuInteraction', 'ModalSubmitInteraction'].includes(this.signalType)) {
            interaction = this.signal as any
        }

        if (this.signalType === 'Message') {
            message = this.signal as Message
        }

        if (this.signalType === 'VoiceState') {
            voiceState = this.signal as VoiceState
        }

        return {
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
                    avatar: member.user.displayAvatarURL(),
                    createdTimestamp: member.user.createdTimestamp
                },
                avatar: member.displayAvatarURL(),
                nickname: member.nickname,
                pending: member.pending,
                roles: member.roles.cache.map(i => {
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
                permissions: member.permissions.toArray(),
                joinedTimestamp: member.joinedTimestamp,
                voice: {
                    channelId: member.voice?.channelId,
                    deaf: member.voice?.deaf,
                    id: member.voice?.id,
                    mute: member.voice?.mute,
                    selfDeaf: member.voice?.selfDeaf,
                    selfMute: member.voice?.selfMute,
                    selfVideo: member.voice?.selfVideo,
                    serverDeaf: member.voice?.serverDeaf,
                    serverMute: member.voice?.serverMute,
                    streaming: member.voice?.streaming
                }
            },
            channel: {
                createdTimestamp: channel.createdTimestamp,
                full: channel['full'],
                id: channel.id,
                lastMessageId: channel.lastMessageId,
                name: channel.name,
                nsfw: channel.nsfw,
                type: channel.type,
                parentId: channel.parentId,
                position: channel.rawPosition,
                rateLimitPerUser: channel.rateLimitPerUser,
                topic: channel.topic
            },
            interaction: {
                customId: interaction?.customId,
                fields: (interaction as ModalSubmitInteraction)?.fields?.fields?.toJSON(),
                guildLocale: interaction?.guildLocale,
                id: interaction?.id,
                locale: interaction?.locale,
                values: (interaction as AnySelectMenuInteraction)?.values
            },
            message: {
                cleanContent: message?.cleanContent,
                content: message?.content,
                createTimestamp: message?.createdTimestamp,
                crosspostable: message?.crosspostable,
                editedTimestamp: message?.editedTimestamp,
                embeds: message?.embeds,
                flags: message?.flags,
                id: message?.id,
                mentions: message?.mentions?.toJSON(),
                pinnable: message?.pinnable,
                type: message?.type,
                url: message?.url
            },
            voiceState: {
                channelId: voiceState?.channelId,
                deaf: voiceState?.deaf,
                id: voiceState?.id,
                mute: voiceState?.mute,
                selfDeaf: voiceState?.selfDeaf,
                selfMute: voiceState?.selfMute,
                selfVideo: voiceState?.selfVideo,
                serverDeaf: voiceState?.serverDeaf,
                serverMute: voiceState?.serverMute,
                streaming: voiceState?.streaming
            }
        }
    }

    getPatterns(string: string) {
        return string?.match?.(/{{\s*((.|\n)+?)\s*}}/g)?.map?.(i => i.slice(2, i.length - 2).trim()) ?? []
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
                const error = err.toString().replace(/<isolated-vm>:?/, '')
                string = string.replace(regexp, () => error)

                await this.self.logger.handleError({ module: 'Automation', action: 'ReplacePatterns', error: err, guild_id: this.signal.guild.id })
            }
        }

        this.usedPatterns.push(...patterns)

        return string
    }

    async transformTemplateMessage(message: { content: string; embed: ServerMessageTemplateEmbed; components?: any[][] }, ctx: Context) {
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

        const returning = {} as { content: string; embeds: EmbedBuilder[]; components: any }

        if (content) returning.content = content
        if (message.embed && message.embed.active) returning.embeds = [new EmbedBuilder(embed)]
        if (message.components) returning.components = transformMessageComponents(message.components)

        return returning
    }

    async execute() {
        const t = this.self.i18n.t.bind(null, this.server.locale)
        const ctx = this.isolate.createContextSync()
        ctx.global.setSync('global', ctx.global.derefInto())

        const globalValues = await this.getGlobalValues()

        for (const value of Object.keys(globalValues)) {
            ctx.global.setSync(value, globalValues[value], { copy: true })
        }

        ctx.global.setSync('setValue', (key: string, value: any) => {
            const used = this.useFunction('setValue')

            if (used > 5) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')

            if (typeof key !== 'string' || !key.length) throw new TypeError('INVALID_PARAMETERS')
            if (!value || typeof value === 'function' || value === null) throw new TypeError('INVALID_PARAMETERS')

            this.storage.set(`${globalValues.guild.id}.${key}`, value)
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

                    return this.storage.get(`${globalValues.guild.id}.${key}`)
                }
            ],
            { arguments: { reference: true } }
        )

        ctx.global.setSync('deleteValue', (key: string) => {
            if (typeof key !== 'string' || !key.length) throw new TypeError('INVALID_PARAMETERS')

            this.storage.delete(`${globalValues.guild.id}.${key}`)
        })

        if (this.automation.components.length > 1 && this.automation.components.some(i => i.action?.type === 'EXECUTE_CODE')) {
            this.automation.components = [this.automation.components.find(i => i.action?.type === 'EXECUTE_CODE')]
        }

        for (const component of this.automation.components) {
            if (component.type === 'CONDITION') {
                const { condition } = component

                if (condition.type === 'COMPARE_VALUES') {
                    const { compare_values } = condition

                    const leftVal = await this.replacePatterns(compare_values.left, ctx)
                    const rightVal = await this.replacePatterns(compare_values.right, ctx)

                    if (compare_values.operator === 'EQUAL') {
                        if (leftVal !== rightVal) break
                    }

                    if (compare_values.operator === 'NOT_EQUAL') {
                        if (leftVal === rightVal) break
                    }

                    if (compare_values.operator === 'STARTS_WITH') {
                        if (!leftVal.startsWith(rightVal)) break
                    }

                    if (compare_values.operator === 'ENDS_WITH') {
                        if (!leftVal.endsWith(rightVal)) break
                    }

                    if (compare_values.operator === 'GREATER_THAN') {
                        if (leftVal < rightVal) break
                    }

                    if (compare_values.operator === 'LESS_THAN') {
                        if (leftVal > rightVal) break
                    }

                    if (compare_values.operator === 'CONTAINS') {
                        if (!leftVal.includes(rightVal)) break
                    }

                    if (compare_values.operator === 'NOT_CONTAINS') {
                        if (leftVal.includes(rightVal)) break
                    }
                }
            }

            if (component.type === 'ACTION') {
                const { action } = component

                if (action.type === 'EXECUTE_CODE' && !this.server.premium.available) {
                    if (['ButtonInteraction', 'StringSelectMenuInteraction', 'ModalSubmitInteraction'].includes(this.signalType)) {
                        const interaction = this.signal as ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction

                        await interaction.reply({
                            content: `${this.self.staticEmojis.ERROR} | ${t('Commands.CommandExecutionOnlyWithPremium', {
                                username: `**${interaction.user.globalName}**`
                            })}`,
                            ephemeral: true
                        })
                    }

                    if (this.signalType === 'Message') {
                        const message = this.signal as Message

                        await message.reply({
                            content: `${this.self.staticEmojis.ERROR} | ${t('Commands.CommandExecutionOnlyWithPremium', {
                                username: `**${message.author.globalName}**`
                            })}`
                        })
                    }

                    break
                }

                if (action.type === 'EXECUTE_CODE' && this.server.premium.available) {
                    const interaction = this.signal as ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction

                    const functions = {
                        createChannel: async (rawOptions: Partial<GuildChannelCreateOptions>) => {
                            const used = this.useFunction('createChannel')

                            if (used > 1) throw new Error('The limit method calls has been reached')

                            const options = {
                                name: rawOptions?.name,
                                type: rawOptions?.type,
                                topic: rawOptions?.topic,
                                nsfw: !!rawOptions?.nsfw,
                                bitrate: rawOptions?.bitrate,
                                userLimit: rawOptions?.userLimit,
                                position: rawOptions?.position,
                                rateLimitPerUser: rawOptions?.rateLimitPerUser,
                                parent: rawOptions.parent
                            }

                            const channel = await interaction.guild.channels.create(options)

                            return {
                                createdTimestamp: channel.createdTimestamp,
                                full: channel['full'],
                                id: channel.id,
                                lastMessageId: channel.lastMessageId,
                                name: channel.name,
                                nsfw: channel.nsfw,
                                type: channel.type,
                                parentId: channel.parentId,
                                position: channel.rawPosition,
                                rateLimitPerUser: channel.rateLimitPerUser,
                                topic: channel['topic']
                            }
                        },
                        createThread: async (channelId: string, rawOptions: Partial<StartThreadOptions>) => {
                            const used = this.useFunction('createThread')

                            if (used > 1) throw new Error('The limit method calls has been reached')
                            if (typeof channelId !== 'string') throw new TypeError('The "channelId" argument must be a string')

                            const channel = interaction.guild.channels.cache.get(channelId) as BaseGuildTextChannel

                            if (!channel) throw new Error('Unknown channel')

                            let thread: ThreadChannel

                            if (channel.type === ChannelType.GuildForum) {
                                const options = {
                                    name: rawOptions?.name,
                                    message: {
                                        content: rawOptions?.['message']?.content ?? null,
                                        embeds: rawOptions?.['message']?.embeds?.length
                                            ? rawOptions['message'].embeds.map(i => {
                                                  return new EmbedBuilder(i as any).toJSON()
                                              })
                                            : [],
                                        components: transformMessageComponents(rawOptions?.['message']?.components as any)
                                    }
                                }

                                thread = await channel.threads.create(options)
                            } else {
                                thread = await channel.threads.create({
                                    name: rawOptions?.name,
                                    startMessage: rawOptions?.['messageId']
                                })
                            }

                            return {
                                archived: thread?.archived,
                                archivedTimestamp: thread?.archiveTimestamp,
                                createdTimestamp: thread?.createdTimestamp,
                                id: thread?.id,
                                ownerId: thread?.ownerId,
                                parentId: thread?.parentId,
                                rateLimitPerUser: thread?.rateLimitPerUser,
                                totalMessageSent: thread?.totalMessageSent
                            }
                        },
                        deferReply: async (rawOptions: InteractionDeferReplyOptions) => {
                            const used = this.useFunction('deferReply')

                            if (used > 1) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (!['ButtonInteraction', 'StringSelectMenuInteraction', 'ModalSubmitInteraction'].includes(this.signalType))
                                throw new TypeError('Method "deferReply" only available for Button, SelectMenu and Modal')

                            const options = {
                                ephemeral: Boolean(rawOptions?.ephemeral)
                            }

                            await interaction.deferReply(options)
                        },
                        deferUpdate: async () => {
                            const used = this.useFunction('deferUpdate')

                            if (used > 3) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (!['ButtonInteraction', 'StringSelectMenuInteraction', 'ModalSubmitInteraction'].includes(this.signalType))
                                throw new TypeError('Method "deferUpdate" only available for Button, SelectMenu and Modal')

                            await interaction.deferUpdate()
                        },
                        deleteChannel: async (channelId: string) => {
                            const used = this.useFunction('deleteChannel')

                            if (used > 2) throw new Error('The limit method calls has been reached')
                            if (typeof channelId !== 'string') throw new TypeError('The "channelId" argument must be a string')

                            const channel = interaction.guild.channels.cache.get(channelId)

                            if (!channel) throw new Error('Unknown channel')

                            await channel.delete()
                        },
                        deleteMessage: async (channelId: string, messageId: string) => {
                            const used = this.useFunction('deleteMessage')

                            if (used > 2) throw new Error('The limit method calls has been reached')
                            if (typeof channelId !== 'string') throw new TypeError('The "channelId" argument must be a string')
                            if (typeof messageId !== 'string') throw new TypeError('The "messageId" argument must be a string')

                            const channel = interaction.guild.channels.cache.get(channelId) as BaseGuildTextChannel

                            if (!channel) throw new Error('Unknown channel')

                            const message = await channel.messages.fetch({ message: messageId })

                            if (!message) throw new Error('Unknown message')

                            if (message.deletable) {
                                await message.delete()
                            }
                        },
                        deleteReply: async () => {
                            const used = this.useFunction('deleteReply')

                            if (used > 1) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (!['ButtonInteraction', 'StringSelectMenuInteraction', 'ModalSubmitInteraction'].includes(this.signalType))
                                throw new TypeError('Method "deleteReply" only available for Button, SelectMenu and Modal')

                            await interaction.deleteReply()
                        },
                        editReply: async (rawOptions: InteractionEditReplyOptions) => {
                            const used = this.useFunction('editReply')

                            if (used > 3) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (!['ButtonInteraction', 'StringSelectMenuInteraction', 'ModalSubmitInteraction'].includes(this.signalType))
                                throw new TypeError('Method "editReply" only available for Button, SelectMenu and Modal')

                            const options = {
                                content: rawOptions?.content ?? undefined,
                                embeds: transformMessageEmbeds(rawOptions?.embeds as any),
                                components: transformMessageComponents(rawOptions?.components as any)
                            }

                            await interaction.deferUpdate()
                            await interaction.editReply(options)
                        },
                        followUpReply: async (rawOptions: InteractionReplyOptions) => {
                            const used = this.useFunction('followUpReply')

                            if (used > 3) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (!['ButtonInteraction', 'StringSelectMenuInteraction', 'ModalSubmitInteraction'].includes(this.signalType))
                                throw new TypeError('Method "followUpReply" only available for Button, SelectMenu and Modal')

                            const options = {
                                content: rawOptions?.content ?? undefined,
                                embeds: transformMessageEmbeds(rawOptions?.embeds as any),
                                components: transformMessageComponents(rawOptions?.components as any),
                                tts: Boolean(rawOptions?.tts),
                                ephemeral: Boolean(rawOptions?.ephemeral)
                            }

                            await interaction.followUp(options)
                        },
                        getUserActivity: async (userId: string) => {
                            const used = this.useFunction('getUserActivity')

                            if (used > 3) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (typeof userId !== 'string') throw new TypeError('INVALID_ARGUMENTS')

                            const user = await this.self.db.users.findOne({ _id: userId })
                            const userActivities = {
                                level: user?.activities?.levels?.find?.(i => i.guild_id === interaction.guildId),
                                wallet: user?.activities?.wallets?.find?.(i => i.guild_id === interaction.guildId)
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
                            if (!['ButtonInteraction', 'StringSelectMenuInteraction', 'ModalSubmitInteraction'].includes(this.signalType))
                                throw new TypeError('Method "reply" only available for Button, SelectMenu and Modal')

                            const options = {
                                content: rawOptions?.content ?? undefined,
                                embeds: transformMessageEmbeds(rawOptions?.embeds as any),
                                components: transformMessageComponents(rawOptions?.components as any),
                                tts: Boolean(rawOptions?.tts),
                                ephemeral: Boolean(rawOptions?.ephemeral)
                            }

                            await interaction.reply(options)
                        },
                        showModal: async (rawOptions: ModalComponentData) => {
                            const used = this.useFunction('showModal')

                            if (used > 1) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (!['ButtonInteraction', 'StringSelectMenuInteraction'].includes(this.signalType))
                                throw new TypeError('Method "showModal" only available for Button and SelectMenu')

                            const options = {
                                title: rawOptions?.title,
                                customId: `UD-${rawOptions?.customId}`,
                                components: transformModalComponents(rawOptions?.components as any) as any
                            }

                            if ('showModal' in interaction) {
                                await interaction.showModal(options)
                            }
                        },
                        modifyUserRoles: async (userId: string, roles: string[], mode: 'add' | 'remove' | 'set' = 'add') => {
                            const used = this.useFunction('modifyUserRoles')

                            if (used > 1) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (typeof userId !== 'string' || !Array.isArray(roles) || !roles.every(i => typeof i === 'string'))
                                throw new TypeError('INVALID_ARGUMENTS')

                            const member = await interaction.guild.members.fetch({ user: userId })

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

                            const member = await interaction.guild.members.fetch({ user: userId })
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

                            let wallet = user.activities.wallets.find(i => i.guild_id === interaction.guildId)

                            if (!wallet) {
                                wallet = {
                                    guild_id: interaction.guildId,
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

                            if (amount < 0 && (walletCurrency?.amount ?? 0) - Math.abs(amount) < 0) amount = -(walletCurrency?.amount ?? 0)

                            if (walletCurrency) {
                                await this.self.db.users.updateOne(
                                    {
                                        _id: member.id,
                                        'activities.wallets': { $elemMatch: { guild_id: interaction.guildId, 'currencies.id': currency.id } }
                                    },
                                    {
                                        $inc: {
                                            'activities.wallets.$[guild].currencies.$[currency].amount': amount
                                        }
                                    },
                                    { arrayFilters: [{ 'guild.guild_id': interaction.guildId }, { 'currency.id': currency.id }] }
                                )
                            } else {
                                await this.self.db.users.updateOne(
                                    { _id: member.id, 'activities.wallets.guild_id': interaction.guildId },
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

                            const channel = interaction.guild.channels.cache.get(channelId) as BaseGuildTextChannel

                            if (!channel) throw new Error('UNKNOWN_CHANNEL')

                            const options = {
                                content: rawOptions?.content ?? null,
                                embeds: transformMessageEmbeds(rawOptions?.embeds as any),
                                components: transformMessageComponents(rawOptions?.components as any)
                            }

                            const message = await channel.send(options)

                            return {
                                cleanContent: message.cleanContent,
                                content: message.content,
                                createTimestamp: message.createdTimestamp,
                                crosspostable: message.crosspostable,
                                editedTimestamp: message.editedTimestamp,
                                embeds: message.embeds,
                                flags: message.flags,
                                id: message?.id,
                                mentions: message.mentions.toJSON(),
                                pinnable: message.pinnable,
                                type: message.type,
                                url: message.url
                            }
                        },
                        overwriteChannelPermissions: async (channelIds: string[], permissions: { [key: string]: boolean }, userOrRole: string) => {
                            const used = this.useFunction('overwriteChannelPermissions')

                            if (used > 1) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')
                            if (!Array.isArray(channelIds) || !channelIds.every(i => typeof i === 'string') || typeof userOrRole !== 'string')
                                throw new TypeError('INVALID_ARGUMENTS')

                            const channels = this.signal.guild.channels.cache.filter(i => i.manageable && channelIds.includes(i.id)) as Collection<
                                string,
                                BaseGuildTextChannel
                            >
                            const overwriteOptions = Object.keys(permissions).reduce((obj, k) => {
                                obj[snakeToPascalCase(k)] = permissions[k]
                                return obj
                            }, {})

                            for (const channel of channels.first(5)) {
                                const overwrites = channel.permissionOverwrites.cache.get(userOrRole)

                                try {
                                    if (overwrites) {
                                        await overwrites.edit(overwriteOptions)
                                    } else {
                                        await channel.permissionOverwrites.create(userOrRole, overwriteOptions)
                                    }
                                } catch (err) {}
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
                        let code = execute_code.code
                            .slice(0, 50000)
                            // Remove unsafe regexp and RegExp class
                            .replace(/\/((.|\n)+?)\//g, value => {
                                return safeRegex(value) === true ? value : '/unsafe/'
                            })
                            .replace(/RegExp/gi, '')

                        const script = await this.isolate.compileScript(`(async () => { ${code} })()`)
                        await script.run(ctx, { timeout: 7500, promise: true })
                        this.usedPatterns.push(code)
                    } catch (err) {
                        const error = err.toString().replace(/<isolated-vm>:?/, '')
                        const embed = new EmbedBuilder().setDescription(error).setColor('Red')

                        if (['ButtonInteraction', 'StringSelectMenuInteraction', 'ModalSubmitInteraction'].includes(this.signalType)) {
                            if (interaction.deferred || interaction.replied) {
                                await interaction.followUp({ embeds: [embed], ephemeral: true })
                            } else {
                                await interaction.reply({ embeds: [embed], ephemeral: true })
                            }
                        }

                        if (this.signalType === 'Message') {
                            const message = this.signal as Message
                            await message.reply({ embeds: [embed] })
                        }

                        await this.self.logger.handleError({
                            module: 'Automation',
                            action: 'ExecuteCodeAction',
                            error: error,
                            guild_id: this.signal.guild.id
                        })
                    }

                    break
                }

                if (action.type === 'REPLY') {
                    const index = this.automation.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { reply } = action

                    if (index > 0) continue

                    if ('reply' in this.signal) {
                        const message = await this.transformTemplateMessage(reply.message, ctx)

                        try {
                            if (this.signal instanceof Message) {
                                await this.signal.reply({ ...message })
                            } else {
                                await this.signal.reply({ ...message, ephemeral: reply.options.includes('EPHEMERAL') })
                            }
                        } catch (err) {
                            await this.self.logger.handleError({
                                module: 'Automation',
                                action: 'ReplyAction',
                                error: err,
                                guild_id: this.signal.guildId
                            })
                        }
                    }
                }

                if (action.type === 'SEND_MESSAGE') {
                    const index = this.automation.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { send_message } = action

                    if (index > 1) continue

                    try {
                        const message = await this.transformTemplateMessage(send_message.message, ctx)
                        const channel = this.signal.guild.channels.cache.get(send_message.channel_id) as BaseGuildTextChannel

                        if (channel) {
                            await channel.send({ ...message, tts: send_message.options.includes('TTS') })
                        }
                    } catch (err) {
                        await this.self.logger.handleError({
                            module: 'Automation',
                            action: 'SendMessageAction',
                            error: err,
                            guild_id: this.signal.guild.id
                        })
                    }
                }

                if (action.type === 'MODIFY_ROLES') {
                    const index = this.automation.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { modify_roles } = action

                    if (index > 1) continue

                    try {
                        const user_id = await this.replacePatterns(modify_roles.user_id, ctx)
                        const member = await this.signal.guild.members.fetch({ user: user_id })

                        if (member) {
                            if (modify_roles.add.length) {
                                await member.roles.add(modify_roles.add)
                            }

                            if (modify_roles.remove.length) {
                                await member.roles.remove(modify_roles.remove)
                            }
                        }
                    } catch (err) {
                        await this.self.logger.handleError({
                            module: 'Automation',
                            action: 'ModifyRolesAction',
                            error: err,
                            guild_id: this.signal.guild.id
                        })
                    }
                }

                if (action.type === 'MODIFY_WALLET') {
                    const index = this.automation.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { modify_wallet } = action

                    if (index > 1) continue
                    if (!this.server.modules.economy.active) continue

                    const user_id = modify_wallet.user_id ? await this.replacePatterns(modify_wallet.user_id, ctx) : globalValues.member.user.id
                    let member: GuildMember

                    try {
                        member = await this.signal.guild.members.fetch({ user: user_id })
                    } catch (err) {
                        await this.self.logger.handleError({
                            module: 'Automation',
                            action: 'ModifyRolesActionFetchMember',
                            error: err,
                            guild_id: this.signal.guild.id
                        })
                    }

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

                        let wallet = user.activities.wallets.find(i => i.guild_id == this.signal.guild.id)

                        if (!wallet) {
                            wallet = {
                                guild_id: this.signal.guild.id,
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

                        const walletCurrency = wallet.currencies.find(c => c.id === currency_id)

                        if (amount < 0 && (walletCurrency?.amount ?? 0) - Math.abs(amount) < 0) amount = -(walletCurrency?.amount ?? 0)

                        if (walletCurrency) {
                            await this.self.db.users.updateOne(
                                {
                                    _id: member.id,
                                    'activities.wallets': { $elemMatch: { guild_id: this.signal.guild.id, 'currencies.id': currency_id } }
                                },
                                {
                                    $inc: {
                                        'activities.wallets.$[guild].currencies.$[currency].amount': amount
                                    }
                                },
                                { arrayFilters: [{ 'guild.guild_id': this.signal.guild.id }, { 'currency.id': currency_id }] }
                            )
                        } else {
                            await this.self.db.users.updateOne(
                                { _id: member.id, 'activities.wallets.guild_id': this.signal.guild.id },
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

                if (action.type === 'SHOW_MODAL') {
                    const index = this.automation.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { show_modal } = action

                    if (index > 1) continue

                    try {
                        if ('showModal' in this.signal) {
                            await this.signal.showModal({
                                title: show_modal.title,
                                customId: `UD-${show_modal.customId}`,
                                components: transformModalComponents(show_modal.components) as any
                            })
                        }
                    } catch (err) {
                        await this.self.logger.handleError({
                            module: 'Automation',
                            action: 'ShowModalAction',
                            error: err,
                            guild_id: this.signal.guild.id
                        })
                    }
                }

                if (action.type === 'OVERWRITE_CHANNEL_PERMISSIONS') {
                    const index = this.automation.components.filter(i => i.type === 'ACTION' && i.action.type === action.type).indexOf(component)
                    const { overwrite_channel_permissions } = action

                    if (index > 1) continue

                    const channels = this.signal.guild.channels.cache.filter(
                        i => i.manageable && overwrite_channel_permissions.channels.includes(i.id)
                    ) as Collection<string, BaseGuildTextChannel>
                    const userOrRole = await this.replacePatterns(overwrite_channel_permissions.user_or_role, ctx)
                    const overwriteOptions = Object.keys(overwrite_channel_permissions.permissions).reduce((obj, k) => {
                        obj[snakeToPascalCase(k)] = overwrite_channel_permissions.permissions[k]
                        return obj
                    }, {})

                    for (const channel of channels.first(5)) {
                        const overwrites = channel.permissionOverwrites.cache.get(userOrRole)

                        try {
                            if (overwrites) {
                                await overwrites.edit(overwriteOptions)
                            } else {
                                await channel.permissionOverwrites.create(userOrRole, overwriteOptions)
                            }
                        } catch (err) {
                            await this.self.logger.handleError({
                                module: 'Automation',
                                action: 'OverwriteChannelPermissionsAction',
                                error: err,
                                guild_id: this.signal.guild.id
                            })
                        }
                    }
                }
            }
        }

        this.self.logger.telegram.info(
            `Code Snippets (${this.signal.guild.id}:${globalValues.member.user.id}):\n\`\`\`\n${this.usedPatterns.join('\n\n')}\n\`\`\``
        )
        this.self.emit('moduleExecution', {
            module: 'Automation',
            category: snakeToPascalCase(this.automation.trigger),
            guild: { id: this.signal.guild.id, name: this.signal.guild.name },
            target: { id: globalValues.member.user.id, name: globalValues.member.user.username }
        })

        ctx.release()

        return true
    }

    useFunction(name: string) {
        this.usedFunctions.push(name)
        return this.usedFunctions.filter(i => i === name).length
    }

    static async handleEvent(eventName: ServerModulesAutomationTrigger, self: Lacuna, server: ServerDocument, signal: AutomationSignal) {
        const automation = server.modules.automation
            .slice(0, server.premium.available ? 20 : 5)
            .filter(i => i.trigger === eventName && !i.options.includes('DISABLED'))
            .slice(0, server.premium.available ? 5 : 1)

        if (automation.length) {
            if ('customId' in signal) {
                signal['customId' as any] = signal.customId.replace('UD-', '')
            }
        }

        for (const task of automation) {
            const am = new Automation(self, server, task, signal)

            await am.execute()
        }
    }
}

export type AutomationSignal = GuildMember | ButtonInteraction | AnySelectMenuInteraction | ModalSubmitInteraction | Message | VoiceState
