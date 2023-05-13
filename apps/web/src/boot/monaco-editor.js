import { boot } from 'quasar/wrappers'
import { loader, install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

export default boot(({ app }) => {
    self.MonacoEnvironment = {
        getWorker(_, label) {
            if (label === 'json') {
                return new jsonWorker()
            }
            if (label === 'css' || label === 'scss' || label === 'less') {
                return new cssWorker()
            }
            if (label === 'html' || label === 'handlebars' || label === 'razor') {
                return new htmlWorker()
            }
            if (label === 'typescript' || label === 'javascript') {
                return new tsWorker()
            }
            return new editorWorker()
        }
    }

    monaco.languages.typescript.javascriptDefaults.addExtraLib(`
        function setValue(key: string, value: any): void {}
        function getValue(key: string): Promise<any> {}
        function deleteValue(key: string): void {}

        function deferReply(options: DeferReplyOptions): Promise<void> {}
        function deleteReply(): Promise<void> {}
        function editReply(options: ReplyOptions): Promise<void> {}
        function followUpReply(options: ReplyOptions): Promise<void> {}
        function reply(options: ReplyOptions): Promise<void> {}

        function modifyUserRoles(userId: string, roles: string[], mode?: 'add' | 'remove' | 'set'): Promise<void> {}

        function getUserActivity(userId: string): Promise<UserActivity> {}
        function modifyUserWallet(userId: string, amount: number, currencyId?: string): Promise<void> {}

        function sendMessage(channelId: string, options: MessageOptions): Promise<Message> {}

        interface Message {
            channel: Channel
            createdTimestamp: number
            crosspostable: boolean
            editedTimestamp: boolean
            id: string
            pinnable: boolean
            url: string
        }

        interface MessageOptions {
            content?: string
            embeds?: MessageEmbed[]
            components?: MessageComponent[]
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

        interface MessageComponent {
            type: 'Button'
            style: 'Link'
            label?: string
            emoji?: { name: string, id?: string, animated?: boolean }
            url?: string
            disabled?: boolean
        }

        interface ReplyOptions extends MessageOptions {
            tts?: boolean
            ephemeral?: boolean
        }

        interface DeferReplyOptions {
            ephemeral: boolean
        }

        let channel: Channel
        let command: Command
        let guild: Guild
        let member: Member

        interface Channel {
            id: string
            name: string
            type: number
            parentId: string
            nsfw: boolean
            position: number
            topic?: string
            lastMessageId?: string
            rateLimitPerUser: number
            createdTimestamp: number
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
            economyCurrencies: Array<{ id: string, name: string, symbol: string }>
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
        }

        interface User {
            id: string
            username: string
            discriminator: string
            avatar: string
            createdTimestamp: number
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
    `)

    loader.config({ monaco })
    app.use(VueMonacoEditorPlugin)
})
