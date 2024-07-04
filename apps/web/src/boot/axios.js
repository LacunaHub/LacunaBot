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
const configureRequest = () => {
    const accessToken = Cookies.get('access_token')

    if (accessToken)
        return {
            headers: {
                Authorization: accessToken
            }
        }

    return null
}

const interfaces = {
    auth: {
        getAuthURI(query) {
            return api.get(`/auth?${query}`)
        },
        getBotAuthURI(query) {
            return api.get(`/auth/bot?${query}`)
        },
        exchangeCode(code, redirectURI) {
            return api.post('/auth/exchange-code', {
                code,
                redirect_uri: redirectURI
            })
        }
    },
    common: {
        getPlugins() {
            return api.get(`/common/plugins`, configureRequest())
        },
        getPlugin(pluginId, guildId) {
            return api.get(`/common/plugins/${pluginId}?guildId=${guildId}`, configureRequest())
        },
        getProducts() {
            return api.get('/common/products')
        },
        getReleaseNotes() {
            return api.get('/common/release-notes')
        },
        getState() {
            return api.get('/common/state')
        },
        getVersion() {
            return api.get('/common/version')
        }
    },
    guilds: {
        getSettings(gid) {
            return api.get(`/guilds/${gid}/settings`, configureRequest())
        },
        updateSettings(gid, options) {
            return api.post(`/guilds/${gid}/settings`, options.data, configureRequest())
        },
        updateApplicationCommands(gid) {
            return api.post(`/guilds/${gid}/application-commands`, null, configureRequest())
        },
        updateCustomCommands(gid, options) {
            return api.post(`/guilds/${gid}/custom-commands/${options.method}`, options.data, configureRequest())
        },
        updateTelegramSubscriptions(gid, options) {
            return api.post(`/guilds/${gid}/subscriptions/telegram/${options.method}`, options.data, configureRequest())
        },
        updateTwitchSubscriptions(gid, options) {
            return api.post(`/guilds/${gid}/subscriptions/twitch/${options.method}`, options.data, configureRequest())
        },
        updateYouTubeSubscriptions(gid, options) {
            return api.post(`/guilds/${gid}/subscriptions/youtube/${options.method}`, options.data, configureRequest())
        },
        updateAutoVoices(gid, options) {
            return api.post(`/guilds/${gid}/autovoices/${options.method}`, options.data, configureRequest())
        },
        updateInteractiveMessages(gid, options) {
            return api.post(`/guilds/${gid}/interactive-messages/${options.method}`, options.data, configureRequest())
        },
        updateInteractiveReactions(gid, options) {
            return api.post(`/guilds/${gid}/reactions/${options.method}`, options.data, configureRequest())
        },
        transferDiamond(guildId, toGuildId) {
            return api.post(`/guilds/${guildId}/transfer-diamond/${toGuildId}`, null, configureRequest())
        },
        downloadLogs(guildId) {
            return api.post(`/guilds/${guildId}/download-logs`, null, configureRequest())
        }
    },

    billing: {
        createPayment(options) {
            return api.post(`/billing/payments`, options.data, configureRequest())
        },
        createSubscription(options) {
            return api.post(`/billing/subscriptions`, options.data, configureRequest())
        }
    },

    subscriptions: {
        searchTelegramChannels(gid, options) {
            return api.get(
                `/subscriptions/telegram/search?gid=${gid}&q=${encodeURI(options.query)}`,
                configureRequest()
            )
        },
        searchTwitchChannels(gid, options) {
            return api.get(`/subscriptions/twitch/search?gid=${gid}&q=${encodeURI(options.query)}`, configureRequest())
        },
        searchYouTubeChannels(gid, options) {
            return api.get(`/subscriptions/youtube/search?gid=${gid}&q=${encodeURI(options.query)}`, configureRequest())
        }
    },

    users: {
        getMe() {
            return api.get('/users/@me', configureRequest())
        },
        getBills() {
            return api.get('/users/@me/bills', configureRequest())
        },
        getActivities() {
            return api.get('/users/@me/activities', configureRequest())
        },
        getDiamondGuilds() {
            return api.get('/users/@me/diamond-guilds', configureRequest())
        },
        getPatrons() {
            return api.get('/users/patrons', configureRequest())
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
