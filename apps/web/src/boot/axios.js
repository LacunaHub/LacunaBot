import axios from 'axios'
import { Cookies } from 'quasar'
import { boot } from 'quasar/wrappers'

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: process.env.API })

const interfaces = {
    common: {
        getPlugins() {
            return api.get(`/common/plugins`, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        getPlugin(pluginId, guildId) {
            return api.get(`/common/plugins/${pluginId}?guildId=${guildId}`, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        }
    },
    guilds: {
        getSettings(gid) {
            return api.get(`/guilds/${gid}/settings`, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        updateSettings(gid, options) {
            return api.post(`/guilds/${gid}/settings`, options.data, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        updateApplicationCommands(gid) {
            return api.post(`/guilds/${gid}/application-commands`, null, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        updateCustomCommands(gid, options) {
            return api.post(`/guilds/${gid}/custom-commands/${options.method}`, options.data, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        updateTelegramSubscriptions(gid, options) {
            return api.post(`/guilds/${gid}/subscriptions/telegram/${options.method}`, options.data, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        updateTwitchSubscriptions(gid, options) {
            return api.post(`/guilds/${gid}/subscriptions/twitch/${options.method}`, options.data, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        updateYouTubeSubscriptions(gid, options) {
            return api.post(`/guilds/${gid}/subscriptions/youtube/${options.method}`, options.data, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        updateAutoVoices(gid, options) {
            return api.post(`/guilds/${gid}/autovoices/${options.method}`, options.data, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        updateInteractiveMessages(gid, options) {
            return api.post(`/guilds/${gid}/interactive-messages/${options.method}`, options.data, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        updateInteractiveReactions(gid, options) {
            return api.post(`/guilds/${gid}/reactions/${options.method}`, options.data, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        transferDiamond(guildId, toGuildId) {
            return api.post(`/guilds/${guildId}/transfer-diamond/${toGuildId}`, null, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        downloadLogs(guildId) {
            return api.post(`/guilds/${guildId}/download-logs`, null, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        }
    },

    payments: {
        create(options) {
            return api.post(`/payments`, options.data, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        }
    },

    state: {
        get() {
            return api.get('/state')
        }
    },

    subscriptions: {
        searchTelegramChannels(gid, options) {
            return api.get(`/subscriptions/telegram/search?gid=${gid}&q=${encodeURI(options.query)}`, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        searchTwitchChannels(gid, options) {
            return api.get(`/subscriptions/twitch/search?gid=${gid}&q=${encodeURI(options.query)}`, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        searchYouTubeChannels(gid, options) {
            return api.get(`/subscriptions/youtube/search?gid=${gid}&q=${encodeURI(options.query)}`, {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        }
    },

    users: {
        getMe() {
            return api.get('/users/@me', {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        getBills() {
            return api.get('/users/@me/bills', {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        getActivities() {
            return api.get('/users/@me/activities', {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        getDiamondGuilds() {
            return api.get('/users/@me/diamond-guilds', {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        },
        getPatrons() {
            return api.get('/users/patrons', {
                headers: {
                    Authorization: Cookies.get('access_token')
                }
            })
        }
    }
}

export default boot(({ app }) => {
    // for use inside Vue files (Options API) through this.$axios and this.$api

    app.config.globalProperties.$axios = axios
    // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
    //       so you won't necessarily have to import axios in each vue file

    app.config.globalProperties.$api = api
    // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
    //       so you can easily perform requests against your app's API
})

export { api, interfaces }
