import { Cookies } from 'quasar'
import { event } from 'vue-gtag'

const routes = [
    {
        path: '/',
        component: () => import('src/layouts/MainLayout.vue'),
        children: [
            { path: '', component: () => import('src/pages/LandingPage.vue') },
            {
                path: '@me',
                component: () => import('src/pages/DashboardPage.vue'),
                children: [
                    { path: '', component: () => import('src/pages/DashboardPageProfile.vue') },
                    { path: 'guilds', component: () => import('src/pages/DashboardPageGuilds.vue') },
                    { path: 'bills', component: () => import('src/pages/DashboardPageBills.vue') }
                ],
                beforeEnter: () => {
                    const access_token = Cookies.get('access_token')

                    if (!access_token) {
                        window.location.href = `${process.env.API}/authorize`
                    }
                }
            },
            {
                path: 'guilds/:guild_id/settings',
                component: () => import('src/pages/GuildPageSettings.vue'),
                children: [
                    { path: '', component: () => import('src/pages/GuildPageSettingsGeneral.vue') },
                    { path: 'commands', component: () => import('src/pages/GuildPageSettingsCommands.vue') },
                    { path: 'moderation', component: () => import('src/pages/GuildPageSettingsModeration.vue') },
                    { path: 'activities', component: () => import('src/pages/GuildPageSettingsActivities.vue') },
                    { path: 'subscriptions', component: () => import('src/pages/GuildPageSettingsSubscriptions.vue') },
                    { path: 'voice-channels', component: () => import('src/pages/GuildPageSettingsVoiceChannels.vue') },
                    { path: 'utility', component: () => import('src/pages/GuildPageSettingsUtility.vue') },
                    { path: 'change-log', component: () => import('src/pages/GuildPageSettingsChangeLog.vue') },
                    {
                        path: 'custom-behavior',
                        component: () => import('src/pages/GuildPageSettingsCustomBehavior.vue')
                    }
                ]
            },
            {
                path: 'state',
                component: () => import('src/pages/StatePage.vue')
            },
            {
                path: 'patrons',
                component: () => import('src/pages/PatronsPage.vue')
            }
        ],
        beforeEnter: to => {
            if (to.query.code || to.query.error) {
                window.opener.postMessage(to.query, window.location.origin)
            }
        }
    },

    {
        path: '/authorize',
        children: [
            {
                path: '',
                component: () => import('pages/LandingPage.vue'),
                beforeEnter: () => {
                    event('login', { method: 'Discord' })
                    window.location.href = `${process.env.API}/authorize`
                }
            },
            {
                path: 'add',
                component: () => import('pages/LandingPage.vue'),
                beforeEnter: to => {
                    event('link_follow', { event_category: 'links', event_label: 'Add Bot' })
                    const query = new URLSearchParams(to.query).toString()
                    window.location.href = `${process.env.API}/authorize/add?${query}`
                }
            },
            {
                path: 'linked-roles',
                component: () => import('pages/LandingPage.vue'),
                beforeEnter: () => {
                    event('link_follow', { event_category: 'links', event_label: 'Linked Roles' })
                    window.location.href = `${process.env.API}/authorize/linked-roles`
                }
            }
        ]
    },

    {
        path: '/authorization',
        component: () => import('src/pages/AuthorizationResultPage.vue')
    },

    {
        path: '/:catchAll(.*)*',
        component: () => import('pages/ErrorNotFound.vue')
    }
]

export default routes
