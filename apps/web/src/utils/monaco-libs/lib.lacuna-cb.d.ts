declare var global: typeof globalThis

declare let channel: Channel

declare let command: Command

declare let guild: Guild

declare let interaction: Interaction

declare let member: Member

declare let message: Message

declare let voiceState: VoiceState

/**
 * Creates a new channel in the guild.
 */
declare function createChannel(options: CreateChannelOptions): Promise<Channel>

/**
 * Creates a new thread in the specified channel.
 */
declare function createThread(channelId: string, options: CreateThreadOptions): Promise<Thread>

/**
 * Defers the reply to an interaction.
 */
declare function deferReply(options?: DeferReplyOptions): Promise<void>

/**
 * Defers the update of the interaction.
 */
declare function deferUpdate(): Promise<void>

/**
 * Deletes the channel or thread.
 */
declare function deleteChannel(channelId: string): Promise<void>

/**
 * Deletes the message.
 */
declare function deleteMessage(channelId: string, messageId: string): Promise<void>

/**
 * Deletes reply to the interaction.
 */
declare function deleteReply(): Promise<void>

/**
 * Deletes value from the storage with specified key.
 */
declare function deleteValue(key: string): void

/**
 * Edits the bot's message.
 */
declare function editMessage(channelId: string, messageId: string, options: MessageOptions): Promise<Message>

/**
 * Edits the reply to the interaction.
 */
declare function editReply(options: MessageOptions): Promise<void>

/**
 * Sends a follow-up reply to the interaction.
 */
declare function followUpReply(options: ReplyOptions): Promise<void>

/**
 * Gets activity of the user.
 */
declare function getUserActivity(userId: string): Promise<UserActivity>

/**
 * Returns value from the storage with specified key.
 */
declare function getValue(key: string): Promise<any>

/**
 * Sends a reply to the interaction.
 */
declare function reply(options: ReplyOptions): Promise<void>

/**
 * Sets value based on the key. If the key does not exist, it will be created, otherwise overwrites the key data.
 */
declare function setValue(key: string, value: any): void

/**
 * Shows a modal to the user.
 */
declare function showModal(options: ShowModalOptions): Promise<void>

/**
 * Modifies the roles of the user.
 */
declare function modifyUserRoles(userId: string, roles: string[], mode: ModifyUserRolesMode): Promise<void>

/**
 * Modifies the user's wallet.
 *
 * @param amount The amount to modify the wallet by. Negative values will deduct from the wallet.
 */
declare function modifyUserWallet(userId: string, amount: number, currencyId?: string): Promise<void>

/**
 * Sends a message to the channel.
 */
declare function sendMessage(channelId: string, options: MessageOptions): Promise<Message>

/**
 * Overwrites the channel permissions for the user or role.
 */
declare function overwriteChannelPermissions(
    channelId: string,
    permissions: Record<string, boolean>,
    userOrRole: string
): Promise<void>

interface ButtonComponent extends Component {
    type: ComponentType.Button
    disabled?: boolean
    emoji?: Emoji
    label?: string
    style: ButtonComponentStyle
    url?: string
}

declare enum ButtonComponentStyle {
    Danger = 'Danger',
    Link = 'Link',
    Primary = 'Primary',
    Secondary = 'Secondary',
    Success = 'Success'
}

interface Channel {
    createdTimestamp: number
    full?: boolean
    id: string
    lastMessageId: string | null
    name: string
    nsfw: boolean
    parentId: string | null
    position: number
    rateLimitPerUser: number | null
    topic?: string | null
    type: ChannelType
}

declare enum ChannelType {
    Announcement = 5,
    AnnouncementThread = 10,
    Category = 4,
    Forum = 15,
    Media = 16,
    PrivateThread = 12,
    PublicThread = 11,
    StageVoice = 13,
    Text = 0,
    Voice = 2
}

interface Command {
    id: string
    name: string
    options: CommandOption[]
}

interface CommandOption {
    channel?: Channel
    name: string
    role?: Role
    user?: User
    value: string | number | boolean
}

interface Component {
    customId: string
    type: ComponentType
}

declare enum ComponentType {
    Button = 'Button',
    SelectMenu = 'SelectMenu',
    TextInput = 'TextInput'
}

interface CreateChannelOptions {
    bitrate?: number
    name: string
    nsfw?: boolean
    parent?: string
    position?: number
    rateLimitPerUser?: number
    topic?: string
    type?: ChannelType
    userLimit?: number
}

interface CreateThreadOptions {
    message?: MessageOptions
    messageId?: string
    name: string
}

interface DeferReplyOptions {
    ephemeral?: boolean
}

interface Emoji {
    animated?: boolean
    id?: string
    name: string
}

interface Guild {
    afkChannelId: string | null
    afkTimeout: number
    banner: string | null
    channels: Channel[]
    createdTimestamp: number
    defaultMessageNotifications: number
    description: string | null
    discoverySplash: string | null
    explicitContentFilter: number
    icon: string | null
    id: string
    mfaLevel: number
    name: string
    nameAcronym: string
    nsfwLevel: number
    ownerId: string
    preferredLocale: Locale
    premiumSubscriptionCount?: number
    premiumTier: number
    publicUpdatesChannelId: string | null
    rulesChannelId: string | null
    roles: Role[]
    safetyAlertsChannelId: string | null
    splash: string | null
    systemChannelId: string | null
    vanityURLCode: string | null
    verificationLevel: number
}

interface Interaction {
    customId: string
    fields?: InteractionField[]
    guildLocale: string
    id: string
    locale: string
    values?: string[]
}

interface InteractionField {
    customId: string
    value: string
}

declare enum Locale {
    Indonesian = 'id',
    EnglishUS = 'en-US',
    EnglishGB = 'en-GB',
    Bulgarian = 'bg',
    ChineseCN = 'zh-CN',
    ChineseTW = 'zh-TW',
    Croatian = 'hr',
    Czech = 'cs',
    Danish = 'da',
    Dutch = 'nl',
    Finnish = 'fi',
    French = 'fr',
    German = 'de',
    Greek = 'el',
    Hindi = 'hi',
    Hungarian = 'hu',
    Italian = 'it',
    Japanese = 'ja',
    Korean = 'ko',
    Lithuanian = 'lt',
    Norwegian = 'no',
    Polish = 'pl',
    PortugueseBR = 'pt-BR',
    Romanian = 'ro',
    Russian = 'ru',
    SpanishES = 'es-ES',
    SpanishLATAM = 'es-419',
    Swedish = 'sv-SE',
    Thai = 'th',
    Turkish = 'tr',
    Ukrainian = 'uk',
    Vietnamese = 'vi'
}

interface Member {
    avatar: string
    joinedTimestamp: number
    nickname: string | null
    pending: boolean
    permissions: string[]
    roles: Role[]
    user: User
    voice: VoiceState
}

interface Message {
    attachments: MessageAttachment[]
    cleanContent: string
    content: string
    createTimestamp: number
    crosspostable: boolean
    editedTimestamp: number
    embeds: MessageEmbed[]
    flags: string[]
    id: string
    mentions: string[]
    pinnable: boolean
    reactions: MessageReaction[]
    type: number
    url: string
}

interface MessageAttachment {
    contentType: string | null
    description: string | null
    id: string
    name: string
    spoiler: boolean
    url: string
}

interface MessageEmbed {
    author?: MessageEmbedAuthor
    color?: number
    description?: string
    fields?: MessageEmbedField[]
    footer?: MessageEmbedFooter
    image?: MessageEmbedImage
    thumbnail?: MessageEmbedImage
    timestamp?: string
    title?: string
    url?: string
}

interface MessageEmbedAuthor {
    icon_url?: string
    name?: string
    url?: string
}

interface MessageEmbedField {
    inline?: boolean
    name: string
    value: string
}

interface MessageEmbedFooter {
    icon_url?: string
    text: string
}

interface MessageEmbedImage {
    url: string
}

interface MessageOptions {
    content?: string
    embeds?: MessageEmbed[]
    components?: Array<ButtonComponent[] | SelectMenuComponent[]>
}

interface MessageReaction {
    emoji: string
    count: number
    userId?: string
}

declare enum ModifyUserRolesMode {
    Add = 'add',
    Remove = 'remove',
    Set = 'Set'
}

interface ReplyOptions extends MessageOptions {
    ephemeral?: boolean
    tts?: boolean
}

interface Role {
    color: string
    hoist: boolean
    icon: string | null
    id: string
    managed: boolean
    mentionable: boolean
    name: string
    position: number
}

interface SelectMenuComponent extends Component {
    type: ComponentType.SelectMenu
    disabled?: boolean
    maxValues?: number
    minValues?: number
    options: SelectMenuComponentOption[]
    placeholder?: string
}

interface SelectMenuComponentOption {
    default?: boolean
    description?: string
    emoji?: Emoji
    label: string
    value: string
}

interface ShowModalOptions {
    components: Array<TextInputComponent[]>
    customId: string
    title: string
}

interface TextInputComponent extends Component {
    type: ComponentType.TextInput
    label: string
    maxLength?: number
    minLength?: number
    placeholder?: string
    required?: boolean
    style: TextInputComponentStyle
    value?: string
}

declare enum TextInputComponentStyle {
    Short = 'Short',
    Paragraph = 'Paragraph'
}

interface Thread {
    archived: boolean
    archivedTimestamp: number | null
    createdTimestamp: number
    id: string
    ownerId: string
    parentId: string
    rateLimitPerUser: number | null
    totalMessageSent: number | null
}

interface User {
    avatar: string | null
    createdTimestamp: number
    discriminator: string
    globalName: string | null
    id: string
    username: string
}

interface UserActivity {
    level: UserActivityLevel
    wallet: number[]
}

interface UserActivityLevel {
    current_xp: number
    rank: number
    total_messages: number
    total_xp: number
    voice_time: number
}

interface VoiceState {
    channelId: string | null
    deaf: boolean
    id: string
    mute: boolean
    selfDeaf: boolean
    selfMute: boolean
    selfVideo: boolean
    serverDeaf: boolean
    serverMute: boolean
    streaming: boolean
}
