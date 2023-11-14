/** Guild object */
let guild: Guild

/** Member who initiated the event */
let member: Member

/** Channel of the event */
let channel: Channel

/** Command object. Only available in custom commands */
let command: Command

/** Interaction object. Only available in automation for trigger \`INTERACTION_BUTTON\`, \`INTERACTION_SELECT_MENU\` and \`INTERACTION_MODAL_SUBMIT\` */
let interaction: Interaction

/** Message object. Only available in automation for trigger \`MESSAGE_CREATE\`, \`MESSAGE_DELETE\` and \`MESSAGE_UPDATE\` */
let message: Message

/**
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#setvalue
 */
function setValue(key: string, value: any): void {}

/**
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#getvalue
 */
function getValue(key: string): Promise<any> {}

/**
 * Creates a new channel in the guild.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#createchannel
 */
function createChannel(options: CreateChannelOptions): Promise<Channel> {}

/**
 * Creates a new thread in the channel.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#createthread
 */
function createThread(channelId: string, options: CreateThreadOptions): Promise<Thread> {}

/**
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#deletevalue
 */
function deleteValue(key: string): void {}

/**
 * Defers the reply to this interaction.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#deferreply
 */
function deferReply(options: DeferReplyOptions): Promise<void> {}

/**
 * Defers an update to the message to which the component was attached.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#deferupdate
 */
function deferUpdate(): Promise<void> {}

/**
 * Deletes channel or thread.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#deletechannel
 */
function deleteChannel(channelId: string): Promise<void> {}

/**
 * Deletes a message.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#deletemessage
 */
function deleteMessage(channelId: string, messageId: string): Promise<void> {}

/**
 * Deletes a reply to this interaction.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#deletereply
 */
function deleteReply(): Promise<void> {}

/**
 * Edits a reply to this interaction.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#editreply
 */
function editReply(options: MessageOptions): Promise<void> {}

/**
 * Send a follow-up message to this interaction.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#followupreply
 */
function followUpReply(options: ReplyOptions): Promise<void> {}

/**
 * Creates a reply to this interaction.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#reply
 */
function reply(options: ReplyOptions): Promise<void> {}

/**
 * Shows a modal component.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#showmodal
 */
function showModal(options: ShowModalOptions): Promise<void> {}

/**
 * Modifies user roles.
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#modifyuserroles
 */
function modifyUserRoles(userId: string, roles: string[], mode?: 'add' | 'remove' | 'set'): Promise<void> {}

/**
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#getuseractivity
 */
function getUserActivity(userId: string): Promise<UserActivity> {}

/**
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#modifyuserwallet
 */
function modifyUserWallet(userId: string, amount: number, currencyId?: string): Promise<void> {}

/**
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#sendmessage
 */
function sendMessage(channelId: string, options: MessageOptions): Promise<Message> {}

/**
 * @link https://docs.lacunabot.com/commands/custom-behavior/functions#overwritechannelpermissions
 * @link https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags
 */
function overwriteChannelPermissions(
    channelIds: string[],
    permissions: { [key: string]: boolean },
    userOrRole: string
): Promise<void> {}

interface Guild {
    id: string
    name: string
    nameAcronym: string
    icon?: string
    channels: Channel[]
    roles: GuildRole[]
    splash?: string
    banner?: string
    description?: string
    discoverySplash?: string
    vanityURLCode?: string
    verificationLevel: number
    nsfwLevel: number
    mfaLevel: number
    afkTimeout: number
    afkChannelId?: string
    rulesChannelId?: string
    systemChannelId?: string
    publicUpdatesChannelId?: string
    premiumTier: number
    premiumSubscriptionCount: number
    explicitContentFilter: number
    defaultMessageNotifications: number
    ownerId: string
    createdTimestamp: number
    economyCurrencies: Array<{ id: string; name: string; symbol: string }>
}

interface GuildRole {
    id: string
    name: string
    color: string
    icon?: string
    hoist: boolean
    managed: boolean
    mentionable: boolean
    position: number
}

interface Member {
    user: User
    avatar: string
    nickname?: string
    pending: boolean
    roles: GuildRole[]
    permissions: string[]
    joinedTimestamp: number
    voice: {
        channelId?: string
        deaf?: boolean
        id?: string
        mute?: boolean
        selfDeaf?: boolean
        selfMute?: boolean
        selfVideo?: boolean
        serverDeaf?: boolean
        serverMute?: boolean
        streaming?: boolean
    }
}

interface User {
    id: string
    username: string
    discriminator: string
    avatar: string
    createdTimestamp: number
}

interface Channel {
    createdTimestamp: number
    full?: boolean
    id: string
    lastMessageId?: string
    name: string
    nsfw?: boolean
    type: number
    parentId: string
    position: number
    rateLimitPerUser: number
    topic?: string
}

interface Thread {
    archived: boolean
    archivedTimestamp: number
    createdTimestamp: number
    id: string
    ownerId: string
    parentId: string
    rateLimitPerUser: number
    totalMessageSent: number
}

interface Command {
    id: string
    name: string
    options: CommandOption[]
}

interface CommandOption {
    name: string
    value: string | number | boolean
    user?: User
    channel?: Channel
    role?: GuildRole
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

interface Message {
    cleanContent: string
    content: string
    createTimestamp: number
    crosspostable: boolean
    editedTimestamp: number
    embeds: MessageEmbed[]
    flags: string[]
    id: string
    mentions: any[]
    pinnable: boolean
    type: number
    url: string
}

interface MessageEmbed {
    author?: {
        icon_url?: string
        name?: string
        url?: string
    }
    color?: number
    description?: string
    fields?: MessageEmbedField[]
    footer?: {
        icon_url?: string
        text?: string
    }
    image?: {
        url: string
    }
    thumbnail?: {
        url: string
    }
    timestamp?: string
    title?: string
    url?: string
}

interface MessageEmbedField {
    inline?: boolean
    name: string
    value: string
}

interface MessageOptions {
    content?: string
    embeds?: MessageEmbed[]
    components?: Array<ComponentButton[] | ComponentSelectMenu[]>
}

interface ReplyOptions extends MessageOptions {
    tts?: boolean
    ephemeral?: boolean
}

interface DeferReplyOptions {
    ephemeral: boolean
}

interface ShowModalOptions {
    title: string
    customId: string
    components: Array<ComponentTextInput[]>
}

interface BaseComponent {
    /** Message component type. Can be "Button", "SelectMenu" or "TextInput". */
    type: 'Button' | 'SelectMenu' | 'TextInput'
}

interface ComponentButton extends BaseComponent {
    type: 'Button'
    customId?: string
    disabled?: boolean
    emoji?: { name: string; id?: string; animated?: boolean }
    label?: string
    style: 'Danger' | 'Link' | 'Primary' | 'Secondary' | 'Success'
    url?: string
}

interface ComponentSelectMenu extends BaseComponent {
    type: 'SelectMenu'
    customId: string
    disabled?: boolean
    maxValues?: number
    minValues?: number
    options: SelectMenuOption[]
    placeholder?: string
}

interface SelectMenuOption {
    default?: boolean
    description?: string
    emoji?: { name: string; id?: string; animated?: boolean }
    label: string
    value: string
}

interface ComponentTextInput extends BaseComponent {
    type: 'TextInput'
    customId: string
    label: string
    maxLength?: number
    minLength?: number
    placeholder?: string
    required?: boolean
    style: 'Paragraph' | 'Short'
    value?: string
}

interface UserActivity {
    level: {
        rank: number
        current_xp: number
        total_xp: number
        total_messages: number
        voice_time: number
    }
    wallet: number[]
}

interface CreateChannelOptions {
    name: string
    type?: 0 | 2 | 4 | 5 | 13 | 15 | 16
    topic?: string
    nsfw?: boolean
    bitrate?: number
    userLimit?: number
    position?: number
    rateLimitPerUser?: number
    parent?: string
}

interface CreateThreadOptions {
    name: string
    message?: MessageOptions
    messageId?: string
}
