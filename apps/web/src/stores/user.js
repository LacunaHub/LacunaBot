import { defineStore } from 'pinia'
import { Cookies } from 'quasar'

export const useUserStore = defineStore('user', {
    state: () => ({
        id: Cookies.get('user_id'),
        name: Cookies.get('user_username'),
        global_name: Cookies.get('user_global_name'),
        avatar: Cookies.get('user_avatar'),
        access_token: Cookies.get('access_token'),
        flags: 0,
        _guilds: [],
        tokens: 0
    }),

    getters: {
        avatarURL(state) {
            return state.avatar && state.id
                ? `https://cdn.discordapp.com/avatars/${state.id}/${state.avatar}.png`
                : `https://cdn.discordapp.com/embed/avatars/${'0001' % 5}.png`
        },
        guilds(state) {
            return state._guilds
                .slice()
                .sort((x, y) => {
                    return x.joined === y.joined ? 0 : x.joined ? -1 : 1
                })
                .map(guild => {
                    return {
                        ...guild,
                        iconURL: guild.icon
                            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                            : `https://cdn.discordapp.com/embed/avatars/${'0001' % 5}.png`
                    }
                })
        },
        badges(state) {
            const employee = (state.flags & 1) === 1
            const partner = (state.flags & 2) === 2
            const hypeSquad = (state.flags & 4) === 4
            const bugHunter1 = (state.flags & 8) === 8
            const hsBravery = (state.flags & 64) === 64
            const hsBrilliance = (state.flags & 128) === 128
            const hsBalance = (state.flags & 256) === 256
            const earlySupporter = (state.flags & 512) === 512
            const bugHunter2 = (state.flags & 16384) === 16384
            const verifiedDeveloper = (state.flags & 131072) === 131072
            const certifiedModerator = (state.flags & 262144) === 262144

            const badges = []

            if (employee) badges.push('STAFF')
            if (partner) badges.push('PARTNER')
            if (hypeSquad) badges.push('HYPESQUAD')
            if (bugHunter1) badges.push('BUG_HUNTER_LEVEL_1')
            if (hsBravery) badges.push('HYPESQUAD_ONLINE_HOUSE_1')
            if (hsBrilliance) badges.push('HYPESQUAD_ONLINE_HOUSE_2')
            if (hsBalance) badges.push('HYPESQUAD_ONLINE_HOUSE_3')
            if (earlySupporter) badges.push('PREMIUM_EARLY_SUPPORTER')
            if (bugHunter2) badges.push('BUG_HUNTER_LEVEL_2')
            if (verifiedDeveloper) badges.push('VERIFIED_DEVELOPER')
            if (certifiedModerator) badges.push('CERTIFIED_MODERATOR')

            return badges
        }
    },

    actions: {
        logout() {
            const cookiesKeys = ['user_id', 'user_username', 'user_global_name', 'user_avatar', 'access_token']
            const domain = window.location.hostname.replace(/^www\./, '')

            for (const key of cookiesKeys) {
                Cookies.remove(key, { domain, path: '/' })
            }

            window.location.pathname = '/'
        }
    }
})
