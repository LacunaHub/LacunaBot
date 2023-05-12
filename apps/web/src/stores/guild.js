import { defineStore } from 'pinia'
import { EmojiIndex } from 'emoji-mart-vue-fast/src'
import Twemoji from 'emoji-mart-vue-fast/data/twitter.json'

export const useGuildStore = defineStore('guild', {
    state: () => ({
        _id: null,
        locale: null,
        prefix: null,
        premium: {},
        server: {},
        commands: {},
        guild: {},
        moderation: {},
        modules: {},
        prices: [],
        change_log: []
    }),

    getters: {
        iconURL(state) {
            return state.guild.icon
                ? `https://cdn.discordapp.com/icons/${state._id}/${state.guild.icon}.png`
                : `https://cdn.discordapp.com/embed/avatars/${'0001' % 5}.png`
        },
        channels(state) {
            return state.guild.channels.map(i => {
                let icon

                const parent = state.guild.channels.find(j => j.id === i.parentId)

                if (i.type === 'GuildCategory') icon = 'folder'
                if (i.type === 'GuildText') icon = 'tag'
                if (i.type === 'GuildNews') icon = 'campaign'
                if (i.type === 'GuildVoice') icon = 'volume_up'
                if (i.type === 'GuildForum') icon = 'forum'
                if (i.type === 'GuildStageVoice') icon = 'wifi_tethering'

                return { ...i, icon, parentName: parent?.name ?? null }
            })
        },
        channelsCategory() {
            return this.channels.filter(i => ['GuildCategory'].includes(i.type))
        },
        channelsText() {
            return this.channels.filter(i => ['GuildText', 'GuildNews'].includes(i.type))
        },
        channelsVoice() {
            return this.channels.filter(i => ['GuildVoice', 'GuildStageVoice'].includes(i.type))
        },
        channelsForum() {
            return this.channels.filter(i => ['GuildForum'].includes(i.type))
        },
        channelsAnnouncement() {
            return this.channels.filter(i => ['GuildNews'].includes(i.type))
        },
        roles(state) {
            return state.guild.roles
        },
        rolesUnmanaged() {
            return this.roles.filter(i => !i.managed)
        },
        emojiIndex(state) {
            const custom = state.guild.emojis.map(e => {
                return {
                    id: e.id,
                    name: e.name,
                    short_names: [e.id, e.name],
                    emoticons: [`<${e.animated ? 'a:' : ':'}${e.name}:${e.id}>`],
                    custom: true,
                    imageUrl: e.url
                }
            })

            return new EmojiIndex(Twemoji, { custom, recent: [] })
        }
    }
})
