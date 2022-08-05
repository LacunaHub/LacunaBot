import { BaseGuildTextChannel, CommandInteraction, GuildMember, GuildMemberRoleManager, MessageEmbed, Team, User } from 'discord.js'
import IVM, { Context } from 'isolated-vm'
import qdb from 'quick.db'
import { ICustomCommand, MessageEmbed as IMessageEmbed, ServerDocument } from '../database/schemas/Servers'
import Lacuna from '../internals/Lacuna'
import logger from '../internals/Logger'
import { escapeRegexp, isValidHttpUrl } from '../internals/utility/Utils'

const isolate = new IVM.Isolate({
    memoryLimit: 128,
    onCatastrophicError(message) {
        logger.telegram.error('IVM Catastrophic Error:', message)
        process.exit()
    }
})
const storage = new qdb.table('publicStorage')

export class CustomCommand {
    public command: ICustomCommand
    public self: Lacuna
    public server: ServerDocument
    public interaction: CommandInteraction
    private usedPatterns: string[]
    private usedFunctions: string[]

    constructor(command: ICustomCommand, self: Lacuna, server: ServerDocument, interaction: CommandInteraction) {
        this.command = command

        this.self = self

        this.server = server

        this.interaction = interaction

        this.usedPatterns = []

        this.usedFunctions = []
    }

    get globalValues() {
        let { channel, commandId, commandName, guild, member, options } = this.interaction

        channel.fetch()
        guild.fetch()

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

                    if (i.type === 'USER') user = options.getUser(i.name)
                    if (i.type === 'CHANNEL') channel = options.getChannel(i.name)
                    if (i.type === 'ROLE') role = options.getRole(i.name)

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
                // Remove all regexp to avoid ReDoS
                pattern = pattern.replace(/\/((.|\n)+?)\//g, '').replace(/RegExp/gi, '')
                const value = await ctx.eval(pattern, { timeout: 96 })
                string = string.replace(regexp, () => {
                    return typeof value === 'undefined' ? '' : value
                })
            } catch (err) {}
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
                color: message.embed.color ?? null,
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

        const returning = {} as { content: string; embeds: MessageEmbed[] }

        if (content) returning.content = content
        if (message.embed && message.embed.active) returning.embeds = [new MessageEmbed(embed)]

        return returning
    }

    async execute() {
        const t = this.self.i18n.t.bind(null, this.server.locale)
        const throttled = this.throttled()

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

        const ctx = isolate.createContextSync()
        ctx.global.set('global', ctx.global.derefInto())

        ctx.global.set('setValue', (key: string, value: any) => {
            this.usedFunctions.push('setValue')
            const used = this.usedFunctions.filter(i => i === 'setValue')

            if (used.length > 5) throw new Error('FUNCTION_CALLS_LIMIT_REACHED')

            if (typeof key !== 'string' || !key.length) throw new TypeError('INVALID_PARAMETERS')
            if (!value || typeof value === 'function' || value === null) throw new TypeError('INVALID_PARAMETERS')

            storage.set(`${this.interaction.guildId}.${key}`, value)
        })

        ctx.global.set('getValue', (key: string) => {
            if (typeof key !== 'string' || !key.length) throw new TypeError('INVALID_PARAMETERS')

            return storage.get(`${this.interaction.guildId}.${key}`)
        })

        ctx.global.set('deleteValue', (key: string) => {
            if (typeof key !== 'string' || !key.length) throw new TypeError('INVALID_PARAMETERS')

            storage.delete(`${this.interaction.guildId}.${key}`)
        })

        for (const smartValue of Object.keys(this.globalValues)) {
            ctx.global.set(smartValue, this.globalValues[smartValue], { copy: true })
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
                            if (message) await this.interaction.reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') }).catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'NOT_EQUAL') {
                        if (leftVal === rightVal) {
                            if (message) await this.interaction.reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') }).catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'STARTS_WITH') {
                        if (!leftVal.startsWith(rightVal)) {
                            if (message) await this.interaction.reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') }).catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'ENDS_WITH') {
                        if (!leftVal.endsWith(rightVal)) {
                            if (message) await this.interaction.reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') }).catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'GREATER_THAN') {
                        if (leftVal < rightVal) {
                            if (message) await this.interaction.reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') }).catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'LESS_THAN') {
                        if (leftVal > rightVal) {
                            if (message) await this.interaction.reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') }).catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'CONTAINS') {
                        if (!leftVal.includes(rightVal)) {
                            if (message) await this.interaction.reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') }).catch(() => {})

                            break
                        }
                    }

                    if (compare_values.operator === 'NOT_CONTAINS') {
                        if (leftVal.includes(rightVal)) {
                            if (message) await this.interaction.reply({ ...message, ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL') }).catch(() => {})

                            break
                        }
                    }
                }
            }

            if (component.type === 'ACTION') {
                const { action } = component

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

                        if (amount < 0 || amount > INT32_MAX) amount = amount > INT32_MAX ? INT32_MAX : 1

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
                                { _id: member.id, 'activities.wallets': { $elemMatch: { guild_id: this.interaction.guildId, 'currencies.id': currency_id } } },
                                {
                                    $inc: {
                                        'activities.wallets.$[guild].currencies.$[currency].amount': modify_wallet.operator === 'INCREMENT' ? amount : -amount
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
                                            amount: modify_wallet.operator === 'INCREMENT' ? amount : 0
                                        }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }

        this.throttle()

        this.self.logger.telegram.info(`Code Snippets (${this.interaction.guildId}:${this.interaction.user.id}):\n\`\`\`\n${this.usedPatterns.join('\n\n')}\n\`\`\``)
        this.self.emit('commandExecution', {
            command: this.interaction.commandName,
            guild: { name: this.interaction.guild.name, id: this.interaction.guildId },
            channel: { name: (this.interaction.channel as BaseGuildTextChannel)?.name, id: this.interaction.channelId },
            user: { name: this.interaction.user.username, id: this.interaction.user.id }
        })

        return true
    }

    throttled() {
        if (this.command.options.includes('THROTTLING')) {
            let path = `${this.interaction.guildId}.users.${this.interaction.user.id}`

            if (this.command.throttling?.type === 'PER_GUILD') {
                path = `${this.interaction.guildId}.guild`
            }

            if (this.command.throttling?.type === 'PER_CHANNEL') {
                path = `${this.interaction.guildId}.channels.${this.interaction.channelId}`
            }

            const throttled = this.self.qdb.get(`throttling.customCommands.${this.command.id}.${path}`)

            if (throttled?.retry_after - Date.now() > 0) {
                return {
                    status: true,
                    retry_after: throttled.retry_after
                }
            }

            if (throttled?.remaining === -1) {
                this.self.qdb.delete(`throttling.customCommands.${this.command.id}.${path}`)
            }

            return {
                status: false
            }
        }

        return {
            status: false
        }
    }

    throttle() {
        if ((this.self.application.owner as Team).members.some(m => m.id === this.interaction.user.id)) return false

        if (this.command.options.includes('THROTTLING')) {
            let path = `${this.interaction.guildId}.users.${this.interaction.user.id}`

            if (this.command.throttling?.type === 'PER_GUILD') {
                path = `${this.interaction.guildId}.guild`
            }

            if (this.command.throttling?.type === 'PER_CHANNEL') {
                path = `${this.interaction.guildId}.channels.${this.interaction.channelId}`
            }

            let throttled = this.self.qdb.get(`throttling.customCommands.${this.command.id}.${path}`)
            if (!throttled) {
                this.self.qdb.set(`throttling.customCommands.${this.command.id}.${path}`, {
                    retry_after: Date.now(),
                    remaining: this.command.throttling.max_uses
                })

                throttled = this.self.qdb.get(`throttling.customCommands.${this.command.id}.${path}`)
            }

            this.self.qdb.subtract(`throttling.customCommands.${this.command.id}.${path}.remaining`, 1)
            throttled.remaining--

            if (throttled.remaining <= 0) {
                this.self.qdb.set(`throttling.customCommands.${this.command.id}.${path}.retry_after`, Date.now() + this.command.throttling.timeout * 1000)
                this.self.qdb.set(`throttling.customCommands.${this.command.id}.${path}.remaining`, -1)
            }
        } else {
            if (this.self.qdb.has(`throttling.customCommands.${this.command.id}.${this.interaction.guildId}`)) {
                this.self.qdb.delete(`throttling.customCommands.${this.command.id}.${this.interaction.guildId}`)
            }
        }
    }
}
