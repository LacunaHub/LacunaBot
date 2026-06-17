import GeminiAPI, { defaultModelParams } from '@/api/utility/GeminiAPI.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { ViolationJudgement, ViolationSeverityLevels } from '@/database/schemas/ViolativeMessages.js'
import Lacuna from '@/internals/Lacuna.js'
import { supportServerId } from '@/internals/utility/Constants.js'
import { capitalizeFirstLetter, fetchFile, parseJSON } from '@/internals/utility/Utils.js'
import { SchemaType, type GenerativeContentBlob, type Part } from '@google/generative-ai'
import {
    Attachment,
    BaseGuildTextChannel,
    EmbedBuilder,
    messageLink as getMessageLink,
    Message,
    MessageType
} from 'discord.js'

const violationCategories = [
    'Spam',
    'Verbally harassing me or someone else',
    'Using rude, vulgar, or offensive language',
    'Promoting hate based on identity or vulnerability',
    'Explicit, graphic, or unwanted sexual content',
    'Evading a ban or block with an alternate account',
    'Threatening violence or real world harm',
    'Content targeting or involving a minor',
    'Spreading misinformation or conspiracy theories',
    'Celebrating or glorifying acts of violence',
    'Harmful misinformation or glorifying violence',
    'This person is too young to use Discord',
    'It mentions self-harm or suicide',
    'Raiding or using multiple accounts',
    'Exposing private identifying information',
    'Impersonation, scam, or fraud',
    'Distributing stolen accounts or credit cards',
    'Selling drugs or other illegal goods',
    'Hacks, cheats, phishing or malicious links'
]
const violationSeverityColors = {
    Low: '4caf50',
    Moderate: 'ff9800',
    High: 'ef5350',
    Severe: 'f44336'
}

const messagePools = new Map<string, AIModMessagePool>()
const generativeModel = GeminiAPI.getGenerativeModel({
    ...defaultModelParams,
    generationConfig: {
        ...defaultModelParams.generationConfig,
        responseMimeType: 'application/json',
        responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
                messages_with_violations: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            message_id: {
                                type: SchemaType.STRING
                            },
                            channel_id: {
                                type: SchemaType.STRING
                            },
                            author_id: {
                                type: SchemaType.STRING
                            },
                            violation_category: {
                                type: SchemaType.STRING,
                                enum: violationCategories
                            },
                            violation_severity_level: {
                                type: SchemaType.STRING,
                                enum: ['Low', 'Moderate', 'High', 'Severe']
                            },
                            violation_judgement: {
                                type: SchemaType.STRING,
                                enum: ['Ban', 'Kick', 'Mute', 'Warn']
                            },
                            message_should_be_deleted: {
                                type: SchemaType.BOOLEAN
                            }
                        },
                        required: ['message_id', 'channel_id', 'author_id', 'message_should_be_deleted']
                    }
                }
            }
        }
    },
    systemInstruction:
        'You are a Discord Moderator with extensive experience in monitoring and reviewing social media messages. Your primary role is to ensure that community guidelines are upheld, while maintaining a positive and secure environment for all users. You are adept at identifying problematic content quickly and effectively, making sure that your evaluations are fair and justified.\n\nYour task is to analyze a set of social media messages for compliance with community guidelines. Here are the details you need to keep in mind:\n- Community guidelines for reference: https://discord.com/guidelines\n- Specific issues to look for (e.g., unauthorized advertising, spam, hate speech, nationalism, politically charged content)\n- Ignore links from well-known sites (e.g., google.com, reddit.com, x.com, etc.)\n\nFor each message that violates community guidelines, please summarize the issue, recommend its removal, and outline the specific guideline it breaches. If a message does not violate any rules, please remove it from consideration and exclude it from the messages_with_violations list. Additionally, any links present within the messages should be checked for security risks, and any potential threats must be reported.\n\nWhen summarizing the violations or justifying the compliance of a message, make sure to be clear and concise.'
})

async function handleMessageCreate(self: Lacuna, server: ServerDocument, message: Message<true>) {
    const env = await self.getEnv()
    if (env.aiModDisabled) return false
    if (![supportServerId, ...(env.aiClosedBetaServerIds ?? [])].includes(message.guildId)) return false

    if (!server.moderation.ai_mod.active || !server.moderation.ai_mod.log_channel_id) return false
    if (![MessageType.Default, MessageType.Reply].includes(message.type)) return false
    if (server.moderation.ai_mod.ignored_channels.includes(message.channelId)) return false
    if (message.member!.roles.cache.some(v => server.moderation.ai_mod.ignored_roles.includes(v.id))) return false
    if ((message.channel as BaseGuildTextChannel)?.nsfw) return false
    if (
        server.moderation.deny_moderate_users_with_mp &&
        message.member!.permissions.any([
            'Administrator',
            'BanMembers',
            'KickMembers',
            'ManageMessages',
            'ManageRoles',
            'ModerateMembers'
        ]) &&
        process.env.NODE_ENV !== 'development'
    )
        return false

    const t = self.i18n.t.bind(null, server.locale)
    const logChannel = message.guild.channels.cache.get(server.moderation.ai_mod.log_channel_id) as BaseGuildTextChannel
    if (!logChannel) return false

    if (typeof env.aiModSystemInstruction === 'string')
        generativeModel.systemInstruction = {
            role: 'user',
            parts: [{ text: env.aiModSystemInstruction }]
        }

    let pool = getPool(message.guildId),
        poolTTL = env.aiModPoolTTL ?? 15_000,
        poolMaxMessages = env.aiModPoolMaxMessages ?? 15

    if (Date.now() - pool.last_message_created_at < poolTTL && pool.timeout) clearPoolTimeout()
    if (pool.messages.length >= poolMaxMessages) {
        clearPoolTimeout()
        moderateMessages()
    }

    pool = getPool(message.guildId)
    if (!pool.timeout) pool.timeout = setTimeout(() => moderateMessages(), poolTTL)

    const pooledMessage = pool.messages.find(v => v.id === message.id)
    pool.last_message_created_at = Date.now()

    if (pooledMessage) {
        pool.messages.splice(
            pool.messages.findIndex(v => v.id === message.id),
            1,
            {
                id: message.id,
                channel_id: message.channelId,
                author_id: message.author.id,
                author_username: message.author.username,
                content: message.cleanContent,
                attachments: message.attachments.toJSON(),
                created_at: message.createdTimestamp,
                edited_at: message.editedTimestamp
            }
        )
    } else {
        pool.messages.push({
            id: message.id,
            channel_id: message.channelId,
            author_id: message.author.id,
            author_username: message.author.username,
            content: message.cleanContent,
            attachments: message.attachments.toJSON(),
            created_at: message.createdTimestamp,
            edited_at: message.editedTimestamp
        })
    }

    async function moderateMessages() {
        const clonedPool = Object.assign({}, pool)
        messagePools.delete(message.guildId)
        clearPoolTimeout()

        const messages = clonedPool.messages.filter(v => v.content || v.attachments.length),
            lastMessage = messages.pop()

        if (!lastMessage) return null

        const chatSession = generativeModel.startChat({
            history: await Promise.all(
                messages.map(async v => {
                    const parts: Part[] = []

                    if (v.content)
                        parts.push({
                            text: `Message ID: ${v.id}\nChannel ID: ${v.channel_id}\nAuthor ID: ${v.author_id}\nMessage content: ${v.content}`
                        })
                    if (v.attachments.length) {
                        const attachments = await resolveAttachedFiles(v.attachments)
                        parts.push(...attachments.map(vv => ({ inlineData: { ...vv } })))
                    }

                    return { role: 'user', parts }
                })
            )
        })

        const lastMessageAttachments = await resolveAttachedFiles(lastMessage.attachments)
        const result = await chatSession.sendMessage([
                {
                    text: `Message ID: ${lastMessage.id}\nChannel ID: ${lastMessage.channel_id}\nAuthor ID: ${lastMessage.author_id}\nMessage content: ${lastMessage.content}`
                },
                ...lastMessageAttachments.map(v => ({ inlineData: { ...v } }))
            ]),
            resultText = result.response.text(),
            response = parseJSON<ModelResponse>(resultText)

        messages.push(lastMessage)

        if (
            typeof response.messages_with_violations !== 'undefined' &&
            Array.isArray(response.messages_with_violations)
        ) {
            const messagesWithViolations = messages.filter(v =>
                response.messages_with_violations!.some(vv => vv.message_id === v.id)
            )
            const violations = messagesWithViolations
                .map(v => {
                    const messageJudgement = response.messages_with_violations!.find(vv => vv.message_id === v.id),
                        messageLink = getMessageLink(v.channel_id, v.id, message.guildId)
                    if (!messageJudgement) return null

                    const violationCategoryIndex = violationCategories.indexOf(messageJudgement.violation_category!)
                    if (violationCategoryIndex === -1) return null

                    let recommendedActions = []
                    if (messageJudgement.violation_judgement)
                        recommendedActions.push(t(`CaseLog.Actions.${messageJudgement.violation_judgement}`))
                    if (messageJudgement.message_should_be_deleted)
                        recommendedActions.push(t('CaseLog.Actions.DeleteMessage'))

                    return {
                        embed: new EmbedBuilder()
                            .setTitle(t(`AIMod.ViolationCategories.${violationCategoryIndex}`))
                            .addFields([
                                {
                                    name: t('Logs.MessageAuthor'),
                                    value: `<@${v.author_id}> (${v.author_username})`,
                                    inline: true
                                },
                                {
                                    name: t('Commands.OptionTypes.Channel'),
                                    value: messageLink,
                                    inline: true
                                },
                                {
                                    name: '\u200B',
                                    value: '\u200B',
                                    inline: true
                                },
                                {
                                    name: t('AIMod.ViolationSeverityLevel'),
                                    value: t(
                                        `AIMod.ViolationSeverityLevels.${messageJudgement.violation_severity_level ?? 'None'}`
                                    ),
                                    inline: true
                                },
                                {
                                    name: t('Commands.ReportCommand.Texts.RecommendedActions'),
                                    value: capitalizeFirstLetter(recommendedActions.join(', ').toLowerCase()) || '-',
                                    inline: true
                                },
                                {
                                    name: '\u200B',
                                    value: '\u200B',
                                    inline: true
                                }
                            ])
                            .setTimestamp(v.created_at)
                            .setColor(
                                messageJudgement.violation_severity_level
                                    ? `#${violationSeverityColors[messageJudgement.violation_severity_level]}`
                                    : null
                            ),
                        document: {
                            server_id: message.guildId,
                            author_id: v.author_id,
                            message_id: v.id,
                            channel_id: v.channel_id,
                            violation_category: violationCategoryIndex,
                            violation_severity_level: messageJudgement.violation_severity_level
                                ? ViolationSeverityLevels[messageJudgement.violation_severity_level]
                                : null,
                            violation_judgement: messageJudgement.violation_judgement
                                ? ViolationJudgement[messageJudgement.violation_judgement]
                                : null
                        }
                    }
                })
                .filter(v => v !== null)

            if (violations.length) {
                await logChannel.send({ embeds: violations.map(v => v.embed) })
                await database.violativeMessages.insertMany(violations.map(v => v.document))
            }
        }

        self.logger.info({ guildId: message.guildId, response }, 'aimod result')

        return response
    }

    function getPool(guildId: string) {
        let pool = messagePools.get(guildId)
        if (!pool)
            pool = messagePools
                .set(guildId, {
                    messages: [],
                    last_message_created_at: 0,
                    timeout: null
                })
                .get(guildId)

        return pool!
    }

    function clearPoolTimeout() {
        if (!pool.timeout) return null

        clearTimeout(pool.timeout)
        pool.timeout = null
    }
}

async function resolveAttachedFiles(attachments: Attachment[]): Promise<GenerativeContentBlob[]> {
    return await Promise.all(
        attachments
            .filter(v => v.contentType?.includes('image/'))
            .map(async v => {
                const file = await fetchFile(v.url)

                return {
                    mimeType: v.contentType!,
                    data: file.data.toString('base64')
                }
            })
    )
}

export default {
    messagePools,
    handleMessageCreate
}

export interface AIModMessagePool {
    messages: AIModMessagePoolMessage[]
    last_message_created_at: number
    timeout: NodeJS.Timeout | null
}

export interface AIModMessagePoolMessage {
    id: string
    channel_id: string
    author_id: string
    author_username: string
    content: string
    attachments: Attachment[]
    created_at: number
    edited_at: number | null
}

export interface ModelResponse {
    messages_with_violations?: ModelResponseMessageWithViolations[]
}

export interface ModelResponseMessageWithViolations {
    message_id: string
    channel_id: string
    author_id: string
    violation_category?: string
    violation_severity_level?: 'Low' | 'Moderate' | 'High' | 'Severe'
    violation_judgement?: 'Ban' | 'Kick' | 'Mute' | 'Warn'
    message_should_be_deleted: boolean
}
