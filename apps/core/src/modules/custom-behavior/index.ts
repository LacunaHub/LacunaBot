import {
    type ServerMessageTemplateEmbed,
    type ServerModulesCustomCommandComponent,
    ServerModulesCustomCommandComponentActionReplyOptions,
    ServerModulesCustomCommandComponentConditionCompareValuesOperators,
    ServerModulesCustomCommandComponentConditionCompareValuesOptions,
    ServerModulesCustomCommandComponentConditionTypes
} from '@/database/schemas/Servers.js'
import type { WalletCurrency } from '@/database/schemas/Users.js'
import {
    snakeToPascalCase,
    transformMessageComponents,
    transformMessageEmbeds,
    transformModalComponents
} from '@/internals/utility/Utils.js'
import {
    type APIEmbed,
    BaseGuildTextChannel,
    ChannelType,
    ChatInputCommandInteraction,
    Collection,
    EmbedBuilder,
    Guild,
    type GuildChannelCreateOptions,
    GuildMember,
    type GuildTextBasedChannel,
    type InteractionDeferReplyOptions,
    type InteractionEditReplyOptions,
    type InteractionReplyOptions,
    Message,
    MessageComponentInteraction,
    MessageMentions,
    type ModalComponentData,
    ModalSubmitInteraction,
    Role,
    Routes,
    ThreadChannel,
    User,
    VoiceState
} from 'discord.js'
import IVM from 'isolated-vm'
import safeRegex from 'safe-regex'
import Automation from './Automation.js'
import CustomCommand from './CustomCommand.js'

export const errors = {
    functionCallsLimitReached: (func: string) => `[${func}] Function call limit reached.`,
    functionNotAvailableInCurrentContext: (func: string) =>
        `[${func}] Function is not available in the current context.`,
    invalidParams: (func: string) => `[${func}] Invalid parameters`,
    argInvalid: (func: string, arg: string) => `[${func}] "${arg}" is invalid.`,
    argInvalidArray: (func: string, arg: string) => `[${func}] "${arg}" must be an array.`,
    argInvalidNumber: (func: string, arg: string) => `[${func}] "${arg}" must be a number.`,
    argInvalidString: (func: string, arg: string) => `[${func}] "${arg}" must be a non-empty string.`,
    channelNotFound: (func: string, channelId: string) => `[${func}] Channel "${channelId}" not found.`
}

export function extendStorage(instance: Automation | CustomCommand, ctx: IVM.Context, guildId: string) {
    ctx.global.setSync('setValue', (key: string, value: any) => {
        const used = instance.useFunction('setValue')
        if (used > 5) throw new Error(errors.functionCallsLimitReached('setValue'))

        if (typeof key !== 'string' || !key.length) throw new TypeError(errors.argInvalidString('setValue', 'key'))
        if (!value || typeof value === 'function' || value === null)
            throw new TypeError(errors.argInvalid('setValue', 'value'))

        instance.storage.set(`${guildId}.${key}`, value)
    })

    ctx.evalClosureSync(
        `
            getValue = function(...args) {
                return $0.apply(undefined, args, { arguments: { copy: true }, result: { promise: true, copy: true } })
            }
        `,
        [
            (key: string) => {
                if (typeof key !== 'string' || !key.length)
                    throw new TypeError(errors.argInvalidString('getValue', 'key'))

                return instance.storage.get(`${guildId}.${key}`)
            }
        ],
        { arguments: { reference: true } }
    )

    ctx.global.setSync('deleteValue', (key: string) => {
        if (typeof key !== 'string' || !key.length) throw new TypeError(errors.argInvalidString('deleteValue', 'key'))

        instance.storage.delete(`${guildId}.${key}`)
    })

    return ctx
}

export function extendScript(instance: Automation | CustomCommand, ctx: IVM.Context) {
    let guild: Guild,
        interaction:
            | ChatInputCommandInteraction<'cached'>
            | ModalSubmitInteraction<'cached'>
            | MessageComponentInteraction<'cached'>

    if (instance instanceof Automation) {
        guild = instance.guild
        interaction = instance.eventParams.interaction ?? ({} as any)
    } else if (instance instanceof CustomCommand) {
        guild = instance.interaction.guild
        interaction = instance.interaction
    }

    const channelFuncs = {
        createChannel: async (rawOptions: Partial<GuildChannelCreateOptions>) => {
            const used = instance.useFunction('createChannel')
            if (used > 1) throw new Error(errors.functionCallsLimitReached('createChannel'))

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

            const channel = await guild.channels.create(options as any)
            return serializeChannel(channel as any)
        },
        createThread: async (channelId: string, rawOptions: Record<string, any>) => {
            const used = instance.useFunction('createThread')
            if (used > 1) throw new Error(errors.functionCallsLimitReached('createThread'))

            if (typeof channelId !== 'string') throw new TypeError(errors.argInvalidString('createThread', 'channelId'))

            const channel = guild.channels.cache.get(channelId) as BaseGuildTextChannel
            if (!channel) throw new Error(errors.channelNotFound('createThread', channelId))

            let thread: ThreadChannel
            if (channel.type === ChannelType.GuildForum) {
                const options = {
                    name: rawOptions?.name,
                    message: {
                        content: rawOptions?.message?.content ?? null,
                        embeds: rawOptions?.message?.embeds?.length
                            ? rawOptions.message.embeds.map((i: any) => {
                                  return new EmbedBuilder(i).toJSON()
                              })
                            : [],
                        components: transformMessageComponents(rawOptions?.message?.components as any)
                    }
                }

                thread = await channel.threads.create(options as any)
            } else {
                thread = await channel.threads.create({
                    name: rawOptions?.name,
                    startMessage: rawOptions?.messageId
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
        deleteChannel: async (channelId: string) => {
            const used = instance.useFunction('deleteChannel')
            if (used > 2) throw new Error(errors.functionCallsLimitReached('deleteChannel'))

            if (typeof channelId !== 'string')
                throw new TypeError(errors.argInvalidString('deleteChannel', 'channelId'))

            const channel = guild.channels.cache.get(channelId)
            if (!channel) throw new Error(errors.channelNotFound('deleteChannel', channelId))

            await channel.delete()
        },
        overwriteChannelPermissions: async (
            channelIds: string[],
            permissions: { [key: string]: boolean },
            userOrRole: string
        ) => {
            const used = instance.useFunction('overwriteChannelPermissions')
            if (used > 1) throw new Error(errors.functionCallsLimitReached('overwriteChannelPermissions'))

            if (!Array.isArray(channelIds) || !channelIds.every(i => typeof i === 'string'))
                throw new TypeError(errors.argInvalidArray('overwriteChannelPermissions', 'channelIds'))
            if (typeof userOrRole !== 'string' || !userOrRole.length)
                throw new TypeError(errors.argInvalidString('overwriteChannelPermissions', 'userOrRole'))

            const channels = guild.channels.cache.filter(i => i.manageable && channelIds.includes(i.id)) as Collection<
                string,
                BaseGuildTextChannel
            >
            const overwriteOptions = Object.keys(permissions).reduce(
                (obj, k) => {
                    obj[snakeToPascalCase(k)] = permissions[k]!
                    return obj
                },
                {} as Record<string, boolean>
            )

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

    const interactionFuncs = {
        deferReply: async (rawOptions: InteractionDeferReplyOptions) => {
            const used = instance.useFunction('deferReply')
            if (used > 1) throw new Error(errors.functionCallsLimitReached('deferReply'))

            if (!('deferReply' in interaction))
                throw new Error(errors.functionNotAvailableInCurrentContext('deferReply'))

            const options = {
                ephemeral: Boolean(rawOptions?.ephemeral)
            }

            await interaction.deferReply(options)
        },
        deferUpdate: async () => {
            const used = instance.useFunction('deferUpdate')
            if (used > 3) throw new Error(errors.functionCallsLimitReached('deferUpdate'))

            if (!('deferUpdate' in interaction))
                throw new Error(errors.functionNotAvailableInCurrentContext('deferUpdate'))

            await interaction.deferUpdate()
        },
        deleteReply: async () => {
            const used = instance.useFunction('deleteReply')
            if (used > 1) throw new Error(errors.functionCallsLimitReached('deleteReply'))

            if (!('deleteReply' in interaction))
                throw new TypeError(errors.functionNotAvailableInCurrentContext('deleteReply'))

            await interaction.deleteReply()
        },
        editReply: async (rawOptions: InteractionEditReplyOptions) => {
            const used = instance.useFunction('editReply')
            if (used > 3) throw new Error(errors.functionCallsLimitReached('editReply'))

            if (!('deferUpdate' in interaction) || !('editReply' in interaction))
                throw new TypeError(errors.functionNotAvailableInCurrentContext('editReply'))

            const options = {
                content: rawOptions?.content ?? undefined,
                embeds: transformMessageEmbeds(rawOptions?.embeds as any),
                components: transformMessageComponents(rawOptions?.components as any)
            }

            await interaction.deferUpdate()
            await interaction.editReply(options as any)
        },
        followUpReply: async (rawOptions: InteractionReplyOptions) => {
            const used = instance.useFunction('followUpReply')
            if (used > 3) throw new Error(errors.functionCallsLimitReached('followUpReply'))

            if (!('followUp' in interaction))
                throw new TypeError(errors.functionNotAvailableInCurrentContext('followUpReply'))

            const options = {
                content: rawOptions?.content ?? undefined,
                embeds: transformMessageEmbeds(rawOptions?.embeds as any),
                components: transformMessageComponents(rawOptions?.components as any),
                tts: Boolean(rawOptions?.tts),
                ephemeral: Boolean(rawOptions?.ephemeral)
            }

            await interaction.followUp(options as any)
        },
        reply: async (rawOptions: InteractionReplyOptions) => {
            const used = instance.useFunction('reply')
            if (used > 1) throw new Error(errors.functionCallsLimitReached('reply'))

            if (!('reply' in interaction)) throw new TypeError(errors.functionNotAvailableInCurrentContext('reply'))

            const options = {
                content: rawOptions?.content ?? undefined,
                embeds: transformMessageEmbeds(rawOptions?.embeds as any),
                components: transformMessageComponents(rawOptions?.components as any),
                tts: Boolean(rawOptions?.tts),
                ephemeral: Boolean(rawOptions?.ephemeral)
            }

            await interaction.reply(options as any)
        },
        showModal: async (rawOptions: ModalComponentData) => {
            const used = instance.useFunction('showModal')
            if (used > 1) throw new Error(errors.functionCallsLimitReached('showModal'))

            if (!('showModal' in interaction))
                throw new TypeError(errors.functionNotAvailableInCurrentContext('showModal'))

            const options = {
                title: rawOptions?.title,
                customId: `UD-${rawOptions?.customId}`,
                components: transformModalComponents(rawOptions?.components as any) as any
            }

            await interaction.showModal(options)
        }
    }

    const messageFuncs = {
        deleteMessage: async (channelId: string, messageId: string) => {
            const used = instance.useFunction('deleteMessage')
            if (used > 2) throw new Error(errors.functionCallsLimitReached('deleteMessage'))

            if (typeof channelId !== 'string')
                throw new TypeError(errors.argInvalidString('deleteMessage', 'channelId'))
            if (typeof messageId !== 'string')
                throw new TypeError(errors.argInvalidString('deleteMessage', 'messageId'))

            const channel = guild.channels.cache.get(channelId) as BaseGuildTextChannel
            if (!channel) throw new Error(errors.channelNotFound('deleteMessage', channelId))

            await instance.self.rest.delete(Routes.channelMessage(channelId, messageId))
        },
        editMessage: async (channelId: string, messageId: string, rawOptions: InteractionReplyOptions) => {
            const used = instance.useFunction('editMessage')
            if (used > 2) throw new Error(errors.functionCallsLimitReached('editMessage'))

            if (typeof channelId !== 'string') throw new TypeError(errors.argInvalidString('editMessage', 'channelId'))
            if (typeof messageId !== 'string') throw new TypeError(errors.argInvalidString('editMessage', 'messageId'))

            const channel = guild.channels.cache.get(channelId) as BaseGuildTextChannel
            if (!channel) throw new Error(errors.channelNotFound('editMessage', channelId))

            const message = await channel.messages.fetch(messageId)
            const options = {
                content: rawOptions?.content ?? undefined,
                embeds: transformMessageEmbeds(rawOptions?.embeds as any),
                components: transformMessageComponents(rawOptions?.components as any)
            }

            const newMessage = await message.edit(options as any)
            return serializeMessage(newMessage)
        },
        sendMessage: async (channelId: string, rawOptions: InteractionReplyOptions) => {
            const used = instance.useFunction('sendMessage')
            if (used > 2) throw new Error(errors.functionCallsLimitReached('sendMessage'))

            if (typeof channelId !== 'string') throw new TypeError(errors.argInvalidString('sendMessage', 'channelId'))

            const channel = guild.channels.cache.get(channelId) as BaseGuildTextChannel
            if (!channel) throw new Error(errors.channelNotFound('sendMessage', channelId))

            const options = {
                content: rawOptions?.content ?? null,
                embeds: transformMessageEmbeds(rawOptions?.embeds as any),
                components: transformMessageComponents(rawOptions?.components as any)
            }

            const message = await channel.send(options as any)
            return serializeMessage(message)
        }
    }

    const userFuncs = {
        getUserActivity: async (userId: string) => {
            const used = instance.useFunction('getUserActivity')
            if (used > 3) throw new Error(errors.functionCallsLimitReached('getUserActivity'))

            if (typeof userId !== 'string') throw new TypeError(errors.argInvalidString('getUserActivity', 'userId'))

            const user = await instance.self.db.users.findOne({ _id: userId }).lean()
            const userActivities = {
                level: user?.activities?.levels?.find(i => i.guild_id === guild.id),
                wallet: user?.activities?.wallets?.find(i => i.guild_id === guild.id)
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
                    }, [] as WalletCurrency[])
                    ?.map(i => i.amount) ?? [0]
            }
        },
        modifyUserRoles: async (userId: string, roles: string[], mode: 'add' | 'remove' | 'set' = 'add') => {
            const used = instance.useFunction('modifyUserRoles')
            if (used > 2) throw new Error(errors.functionCallsLimitReached('modifyUserRoles'))

            if (typeof userId !== 'string') throw new TypeError(errors.argInvalidString('modifyUserRoles', 'userId'))
            if (!Array.isArray(roles) || !roles.every(i => typeof i === 'string'))
                throw new TypeError(errors.argInvalidArray('modifyUserRoles', 'roles'))

            const member = await guild.members.fetch({ user: userId })

            if (mode === 'add') {
                await member.roles.add(roles)
            } else if (mode === 'remove') {
                await member.roles.remove(roles)
            } else if (mode === 'set') {
                await member.roles.set(roles)
            }
        },
        modifyUserWallet: async (userId: string, amount: number, currencyId: string = 'DEFAULT') => {
            const used = instance.useFunction('modifyUserWallet')
            if (used > 2) throw new Error(errors.functionCallsLimitReached('modifyUserWallet'))

            if (typeof userId !== 'string') throw new TypeError(errors.argInvalidString('modifyUserWallet', 'userId'))
            if (typeof amount !== 'number' || isNaN(amount))
                throw new TypeError(errors.argInvalidNumber('modifyUserWallet', 'amount'))
            if (currencyId && typeof currencyId !== 'string')
                throw new TypeError(errors.argInvalidString('modifyUserWallet', 'userId'))
            if (!instance.server.modules.economy.active) throw new Error('[modifyUserWallet] Economy is disabled')

            const member = await guild.members.fetch({ user: userId })
            let currency = instance.server.modules.economy.currencies.find(i => i.id === currencyId)

            if (!currency) {
                currency = instance.server.modules.economy.currencies.find(i => i.id === 'DEFAULT')
            }

            const INT32_MAX = Math.pow(2, 31) - 1
            amount = isNaN(amount) ? 0 : amount

            if (amount > INT32_MAX || amount < -INT32_MAX)
                amount = amount > INT32_MAX ? INT32_MAX : amount < -INT32_MAX ? -INT32_MAX : 0

            const user = await instance.self.db.users.fetch(
                { _id: member.id },
                {
                    user: {
                        username: member.user.username,
                        avatar: member.user.avatar,
                        flags: member.user.flags?.bitfield ?? 0,
                        global_name: member.user.globalName
                    }
                }
            )
            const userWallet = await instance.self.db.users.fetchWallet(user, guild.id)
            const walletCurrency = userWallet.currencies.find(i => i.id === currency!.id)

            if (amount < 0 && (walletCurrency?.amount ?? 0) - Math.abs(amount) < 0)
                amount = -(walletCurrency?.amount ?? 0)

            if (walletCurrency) {
                await instance.self.db.users.updateOne(
                    {
                        _id: member.id,
                        'activities.wallets': { $elemMatch: { guild_id: guild.id, 'currencies.id': currency!.id } }
                    },
                    {
                        $inc: {
                            'activities.wallets.$[guild].currencies.$[currency].amount': amount
                        }
                    },
                    { arrayFilters: [{ 'guild.guild_id': guild.id }, { 'currency.id': currency!.id }] }
                )
            } else {
                await instance.self.db.users.updateOne(
                    { _id: member.id, 'activities.wallets.guild_id': guild.id },
                    {
                        $push: {
                            'activities.wallets.$.currencies': {
                                id: currency!.id,
                                amount: amount
                            }
                        }
                    }
                )
            }
        }
    }

    const funcs = { ...channelFuncs, ...interactionFuncs, ...messageFuncs, ...userFuncs }
    ctx.evalClosureSync(
        Object.keys(funcs)
            .map((i, idx) => {
                return `
                    ${i} = function(...args) {
                        return $${idx}.apply(undefined, args, { arguments: { copy: true }, result: { promise: true, copy: true } })
                    }
                `
            })
            .join(';'),
        Object.values(funcs),
        { arguments: { reference: true } }
    )

    return ctx
}

export async function runScript(
    instance: Automation | CustomCommand,
    ctx: IVM.Context,
    script: string,
    options: RunScriptOptions = {}
) {
    extendScript(instance, ctx)
    let maxScriptLength = options.maxScriptLength ?? 1000

    try {
        script = script
            // Remove unsafe regexps
            .replace(/\/((.|\n)+?)\//g, value => {
                return safeRegex(value) === true ? value : '/unsafe/'
            })

        if (script.length > maxScriptLength)
            throw new Error(`Script size exceeded (${script.length}/${maxScriptLength}).`)
        if (/RegExp/gi.test(script)) throw new Error('Construction "RegExp" is not allowed.')

        const compiledScript = await instance.isolate.compileScript(`(async () => { ${script} })()`)
        await compiledScript.run(ctx, { timeout: 7500, promise: true })
        instance.usedPatterns.push(script)
        compiledScript.release()
    } catch (err) {
        const error = (err as any).toString().replace(/<isolated-vm>:?/gi, '')
        const embed = new EmbedBuilder().setDescription(error).setColor('Red')

        if (instance instanceof Automation) {
            if (instance.eventParams.message && 'content' in instance.eventParams.message)
                await instance.eventParams.message.reply({ embeds: [embed] })
        } else if (instance instanceof CustomCommand) {
            if (instance.interaction.deferred || instance.interaction.replied) {
                await instance.interaction.followUp({ embeds: [embed], ephemeral: true })
            } else {
                await instance.interaction.reply({ embeds: [embed], ephemeral: true })
            }
        }

        instance.self.logger.error({
            module: 'Automation',
            action: 'ExecuteCodeAction',
            err: error,
            guild_id: instance.server._id
        })

        if (options.throwError) throw err
    }
}

export function convertComponentsToScript(components: ServerModulesCustomCommandComponent[]) {
    let script = ''
    if (!components.length) return script
    if (components.some(i => i.action?.type === 'EXECUTE_CODE')) {
        const component = components.find(i => i.action?.type === 'EXECUTE_CODE')!
        script = component.action!.execute_code!.code
        return script
    }

    const replaceWithTemplateString = (string: string) =>
        string ? `\`${string.replace(/{{\s*/g, '${').replace(/\s*}}/g, '}')}\`` : null
    const convertTemplateMessage = (template: {
        content: string
        embed: ServerMessageTemplateEmbed
        components?: any[][]
    }) => {
        let content!: string, embed!: APIEmbed, components

        if (template.content) content = replaceWithTemplateString(template.content)!
        if (template.embed && template.embed.active) {
            let url = template.embed.url ? replaceWithTemplateString(template.embed.url) : null,
                footer_icon_url = template.embed.footer.icon_url
                    ? replaceWithTemplateString(template.embed.footer.icon_url)
                    : null,
                image_url = template.embed.image.url ? replaceWithTemplateString(template.embed.image.url) : null,
                thumbnail_url = template.embed.thumbnail.url
                    ? replaceWithTemplateString(template.embed.thumbnail.url)
                    : null,
                author_url = template.embed.author.url ? replaceWithTemplateString(template.embed.author.url) : null,
                author_icon_url = template.embed.author.icon_url
                    ? replaceWithTemplateString(template.embed.author.icon_url)
                    : null

            if (template.embed.title) embed.title = replaceWithTemplateString(template.embed.title)!
            if (template.embed.description) embed.description = replaceWithTemplateString(template.embed.description)!
            if (url) embed.url = url
            if (template.embed.timestamp) embed.timestamp = replaceWithTemplateString(template.embed.timestamp)!
            if (template.embed.footer.text || footer_icon_url) {
                embed.footer = {} as any
                if (template.embed.footer.text)
                    embed.footer!.text = replaceWithTemplateString(template.embed.footer.text)!
                if (footer_icon_url) embed.footer!.icon_url = footer_icon_url
            }
            if (image_url) embed.image = { url: image_url }
            if (thumbnail_url) embed.thumbnail = { url: thumbnail_url }
            if (template.embed.author.name || author_url || author_icon_url) {
                embed.author = {} as any
                if (template.embed.author.name)
                    embed.author!.name = replaceWithTemplateString(template.embed.author.name)!
                if (author_url) embed.author!.url = author_url
                if (author_icon_url) embed.author!.icon_url = author_icon_url
            }
            if (template.embed.fields.length)
                embed.fields = template.embed.fields
                    .filter(
                        i =>
                            typeof i.name === 'string' && i.name.length && typeof i.value === 'string' && i.value.length
                    )
                    .map(field => {
                        return {
                            name: replaceWithTemplateString(field.name)!,
                            value: replaceWithTemplateString(field.value)!,
                            inline: Boolean(field.inline)
                        }
                    })
        }

        if (Array.isArray(template.components))
            components = JSON.parse(JSON.stringify(template.components).replace(/:\s*"([^"]+)"/g, ': "`$1`"'))

        const result: Record<string, any> = {}
        if (content) result.content = content
        if (embed) result.embeds = [embed]
        if (components) result.components = components

        return result
    }
    const stringify = (value: any, space: string | number = 2) => {
        const string = JSON.stringify(value, null, space)
        return string.replace(/"/g, '')
    }

    for (const component of components) {
        if ('condition' in component) {
            if (component.condition.type === ServerModulesCustomCommandComponentConditionTypes.CompareValues) {
                const compare_values = component.condition.compare_values!

                const leftVal = replaceWithTemplateString(compare_values.left),
                    rightVal = replaceWithTemplateString(compare_values.right)

                let condition: string
                switch (compare_values.operator) {
                    case ServerModulesCustomCommandComponentConditionCompareValuesOperators.Equal:
                        condition = `${leftVal} !== ${rightVal}`
                        break
                    case ServerModulesCustomCommandComponentConditionCompareValuesOperators.NotEqual:
                        condition = `${leftVal} === \`${rightVal}`
                        break
                    case ServerModulesCustomCommandComponentConditionCompareValuesOperators.GreaterThan:
                        condition = `${leftVal} > ${rightVal}`
                        break
                    case ServerModulesCustomCommandComponentConditionCompareValuesOperators.LessThan:
                        condition = `${leftVal} < ${rightVal}`
                        break
                    case ServerModulesCustomCommandComponentConditionCompareValuesOperators.Contains:
                        condition = `!${leftVal}.includes(${rightVal})`
                        break
                    case ServerModulesCustomCommandComponentConditionCompareValuesOperators.NotContains:
                        condition = `${leftVal}.includes(${rightVal})`
                        break
                    case ServerModulesCustomCommandComponentConditionCompareValuesOperators.StartsWith:
                        condition = `!${leftVal}.startsWith(${rightVal})`
                        break
                    case ServerModulesCustomCommandComponentConditionCompareValuesOperators.EndsWith:
                        condition = `!${leftVal}.endsWith(${rightVal})`
                        break
                }

                script += `if (${condition}) {\n`

                if (
                    compare_values.options.includes(
                        ServerModulesCustomCommandComponentConditionCompareValuesOptions.FalseReply
                    ) &&
                    'false_reply' in compare_values
                ) {
                    script += `await reply(`
                    script += `${stringify({
                        ...convertTemplateMessage(compare_values.false_reply as any),
                        ephemeral: compare_values.options.includes(
                            ServerModulesCustomCommandComponentConditionCompareValuesOptions.FalseReplyEphemeral
                        )
                    })}`
                    script += ')\n'
                }

                script += `return null\n}\n\n`
            }
        } else if ('action' in component) {
            const { action } = component

            if (action.modify_roles) {
                if (action.modify_roles.add.length) {
                    script += `await modifyUserRoles(`
                    script += `${replaceWithTemplateString(action.modify_roles.user_id) || 'member.user.id'},`
                    script += `${JSON.stringify(action.modify_roles.add)}`
                    script += ')\n\n'
                }

                if (action.modify_roles.remove.length) {
                    script += `await modifyUserRoles(`
                    script += `${replaceWithTemplateString(action.modify_roles.user_id) || 'member.user.id'},`
                    script += `${JSON.stringify(action.modify_roles.remove)},`
                    script += `'remove')\n\n`
                }
            }

            if (action.modify_wallet) {
                script += `await modifyUserWallet(`
                script += `${replaceWithTemplateString(action.modify_wallet.user_id!) || 'member.user.id'},`
                script += `+${replaceWithTemplateString(action.modify_wallet.amount)},`
                script += `${replaceWithTemplateString(action.modify_wallet.currency_id!)}`
                script += ')\n\n'
            }

            if (action.overwrite_channel_permissions) {
                script += `await overwriteChannelPermissions(`
                script += `${JSON.stringify(action.overwrite_channel_permissions.channels)},`
                script += `${stringify(action.overwrite_channel_permissions.permissions, 0)},`
                script += `${replaceWithTemplateString(action.overwrite_channel_permissions.user_or_role)}`
                script += ')\n\n'
            }

            if (action.reply) {
                script += `await reply(`
                script += `${stringify({
                    ...convertTemplateMessage(action.reply.message as any),
                    ephemeral: action.reply.options.includes(
                        ServerModulesCustomCommandComponentActionReplyOptions.Ephemeral
                    )
                })}`
                script += ')\n\n'
            }

            if (action.send_message) {
                script += `await sendMessage(`
                script += `${action.send_message.channel_id || 'channel.id'},`
                script += `${stringify(convertTemplateMessage(action.send_message.message as any))}`
                script += ')\n\n'
            }

            if (action.show_modal) {
                script += `await showModal(${stringify(JSON.parse(JSON.stringify(action.show_modal).replace(/:\s*"([^"]+)"/g, ': "`$1`"')))})\n\n`
            }
        }
    }

    return script
}

export function serializeChannel(channel: GuildTextBasedChannel) {
    return {
        createdTimestamp: channel.createdTimestamp,
        full: 'full' in channel ? channel.full : undefined,
        id: channel.id,
        lastMessageId: channel.lastMessageId,
        name: channel.name,
        nsfw: Boolean((channel as any).nsfw),
        parentId: channel.parentId,
        position: 'rawPosition' in channel ? channel.rawPosition : undefined,
        rateLimitPerUser: channel.rateLimitPerUser,
        topic: 'topic' in channel ? channel.topic : undefined,
        type: channel.type
    }
}

export function serializeGuild(guild: Guild) {
    return {
        afkChannelId: guild.afkChannelId,
        afkTimeout: guild.afkTimeout,
        banner: guild.bannerURL(),
        channels: guild.channels.cache.map(i => serializeChannel(i as any)),
        createdTimestamp: guild.createdTimestamp,
        defaultMessageNotifications: guild.defaultMessageNotifications,
        description: guild.description,
        discoverySplash: guild.discoverySplashURL(),
        explicitContentFilter: guild.explicitContentFilter,
        icon: guild.iconURL(),
        id: guild.id,
        mfaLevel: guild.mfaLevel,
        name: guild.name,
        nameAcronym: guild.nameAcronym,
        nsfwLevel: guild.nsfwLevel,
        ownerId: guild.ownerId,
        preferredLocale: guild.preferredLocale,
        premiumSubscriptionCount: guild.premiumSubscriptionCount,
        premiumTier: guild.premiumTier,
        publicUpdatesChannelId: guild.publicUpdatesChannelId,
        roles: guild.roles.cache.map(i => serializeRole(i)),
        rulesChannelId: guild.rulesChannelId,
        safetyAlertsChannelId: guild.safetyAlertsChannelId,
        splash: guild.splashURL(),
        systemChannelId: guild.systemChannelId,
        vanityURLCode: guild.vanityURLCode,
        verificationLevel: guild.verificationLevel
    }
}

export function serializeMember(member: GuildMember) {
    return {
        avatar: member.displayAvatarURL(),
        joinedTimestamp: member.joinedTimestamp,
        nickname: member.nickname,
        pending: member.pending,
        permissions: member.permissions.toArray(),
        roles: member.roles.cache.map(i => serializeRole(i)),
        user: serializeUser(member.user),
        voice: serializeVoiceState(member.voice)
    }
}

export function serializeMessage(message: Message) {
    const serializeMentions = (mentions: MessageMentions<true>) => {
        const value = []

        if (mentions?.everyone) value.push('everyone')
        if (mentions?.channels?.size) value.push(...mentions.channels.map(v => v.id))
        if (mentions?.members?.size) value.push(...mentions.members.map(v => v.id))
        if (mentions?.roles?.size) value.push(...mentions.roles.map(v => v.id))

        return value
    }

    const [lrUserId, lrEmoji] = ((message as any)?.lastReaction as string)?.split('/') ?? ''

    return {
        attachments: message.attachments.map(v => {
            return {
                contentType: v.contentType,
                description: v.description,
                id: v.id,
                name: v.name,
                spoiler: v.spoiler,
                url: v.url
            }
        }),
        cleanContent: message.cleanContent,
        content: message.content,
        createTimestamp: message.createdTimestamp,
        crosspostable: message.crosspostable,
        editedTimestamp: message.editedTimestamp,
        embeds: message.embeds,
        flags: message.flags,
        id: message.id,
        mentions: serializeMentions(message.mentions),
        pinnable: message.pinnable,
        reactions: message.reactions.cache.map(v => {
            const emoji = v.emoji.identifier,
                isLast = lrEmoji === emoji

            return {
                emoji,
                count: v.count,
                userId: isLast ? lrUserId : undefined
            }
        }),
        type: message.type,
        url: message.url
    }
}

export function serializeRole(role: Role) {
    return {
        color: role.hexColor,
        hoist: role.hoist,
        icon: role.iconURL(),
        id: role.id,
        managed: role.managed,
        mentionable: role.mentionable,
        name: role.name,
        position: role.rawPosition
    }
}

export function serializeUser(user: User) {
    return {
        avatar: user.displayAvatarURL(),
        createdTimestamp: user.createdTimestamp,
        discriminator: user.discriminator,
        globalName: user.globalName,
        id: user.id,
        username: user.username
    }
}

export function serializeVoiceState(voiceState: VoiceState) {
    return {
        channelId: voiceState.channelId,
        deaf: voiceState.deaf,
        id: voiceState.id,
        mute: voiceState.mute,
        selfDeaf: voiceState.selfDeaf,
        selfMute: voiceState.selfMute,
        selfVideo: voiceState.selfVideo,
        serverDeaf: voiceState.serverDeaf,
        serverMute: voiceState.serverMute,
        streaming: voiceState.streaming
    }
}

export interface RunScriptOptions {
    throwError?: boolean
    maxScriptLength?: number
}
