import axios from 'axios'
import { Cookies } from 'quasar'
import { boot } from 'quasar/wrappers'

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({ baseURL: process.env.PROD ? 'https://api.lacunabot.com' : '/api' })
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
        get(gid) {
            return api.get(`/guilds/${gid}`)
        },
        getLeaders(gid, query) {
            return api.get(`/guilds/${gid}/leaders?${query}`, configureRequest())
        },
        getLogs(guildId) {
            return api.get(`/guilds/${guildId}/logs`, configureRequest())
        },
        getSettings(gid) {
            return api.get(`/guilds/${gid}/settings`, configureRequest())
        },
        updateSettings(gid, options) {
            return api.post(`/guilds/${gid}/settings`, options.data, configureRequest())
        },
        createAutoVoice(guildId, data) {
            return api.post(`/guilds/${guildId}/settings/auto-voices`, data, configureRequest())
        },
        deleteAutoVoice(guildId, avId) {
            return api.delete(`/guilds/${guildId}/settings/auto-voices/${avId}`, configureRequest())
        },
        updateAutoVoice(guildId, avId, data) {
            return api.patch(`/guilds/${guildId}/settings/auto-voices/${avId}`, data, configureRequest())
        },
        createCustomCommand(guildId, data) {
            return api.post(`/guilds/${guildId}/settings/custom-commands`, data, configureRequest())
        },
        deleteCustomCommand(guildId, commandId) {
            return api.delete(`/guilds/${guildId}/settings/custom-commands/${commandId}`, configureRequest())
        },
        updateCustomCommand(guildId, commandId, data) {
            return api.patch(`/guilds/${guildId}/settings/custom-commands/${commandId}`, data, configureRequest())
        },
        createDAMERule(guildId, data) {
            return api.post(`/guilds/${guildId}/settings/dame-rules`, data, configureRequest())
        },
        deleteDAMERule(guildId, ruleId) {
            return api.delete(`/guilds/${guildId}/settings/dame-rules/${ruleId}`, configureRequest())
        },
        updateDAMERule(guildId, ruleId, data) {
            return api.patch(`/guilds/${guildId}/settings/dame-rules/${ruleId}`, data, configureRequest())
        },
        createInteractiveMessage(guildId, data) {
            return api.post(`/guilds/${guildId}/settings/interactive-messages`, data, configureRequest())
        },
        deleteInteractiveMessage(guildId, imId) {
            return api.delete(`/guilds/${guildId}/settings/interactive-messages/${imId}`, configureRequest())
        },
        updateInteractiveMessage(guildId, imId, data) {
            return api.patch(`/guilds/${guildId}/settings/interactive-messages/${imId}`, data, configureRequest())
        },
        createInteractiveReaction(guildId, data) {
            return api.post(`/guilds/${guildId}/settings/interactive-reactions`, data, configureRequest())
        },
        deleteInteractiveReaction(guildId, irId) {
            return api.delete(`/guilds/${guildId}/settings/interactive-reactions/${irId}`, configureRequest())
        },
        updateInteractiveReaction(guildId, irId, data) {
            return api.patch(`/guilds/${guildId}/settings/interactive-reactions/${irId}`, data, configureRequest())
        },
        createTelegramSubscription(guildId, data) {
            return api.post(`/guilds/${guildId}/settings/social-alerts/telegram`, data, configureRequest())
        },
        createTwitchSubscription(guildId, data) {
            return api.post(`/guilds/${guildId}/settings/social-alerts/twitch`, data, configureRequest())
        },
        createYouTubeSubscription(guildId, data) {
            return api.post(`/guilds/${guildId}/settings/social-alerts/youtube`, data, configureRequest())
        },
        deleteTelegramSubscription(guildId, channelId) {
            return api.delete(`/guilds/${guildId}/settings/social-alerts/telegram/${channelId}`, configureRequest())
        },
        deleteTwitchSubscription(guildId, channelId) {
            return api.delete(`/guilds/${guildId}/settings/social-alerts/twitch/${channelId}`, configureRequest())
        },
        deleteYouTubeSubscription(guildId, channelId) {
            return api.delete(`/guilds/${guildId}/settings/social-alerts/youtube/${channelId}`, configureRequest())
        },
        updateTelegramSubscription(guildId, channelId, data) {
            return api.patch(
                `/guilds/${guildId}/settings/social-alerts/telegram/${channelId}`,
                data,
                configureRequest()
            )
        },
        updateTwitchSubscription(guildId, channelId, data) {
            return api.patch(`/guilds/${guildId}/settings/social-alerts/twitch/${channelId}`, data, configureRequest())
        },
        updateYouTubeSubscription(guildId, channelId, data) {
            return api.patch(`/guilds/${guildId}/settings/social-alerts/youtube/${channelId}`, data, configureRequest())
        },
        transferDiamond(guildId, toGuildId) {
            return api.post(`/guilds/${guildId}/transfer-diamond/${toGuildId}`, null, configureRequest())
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
