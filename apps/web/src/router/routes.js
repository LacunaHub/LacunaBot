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
                ]
            },
            {
                path: 'guilds/:guild_id',
                component: () => import('src/pages/GuildPage.vue'),
                children: [
                    { path: '', component: () => import('src/pages/GuildPageAbout.vue') },
                    { path: 'leaders', component: () => import('src/pages/GuildPageLeaders.vue') }
                ]
            },
            {
                path: 'guilds/:guild_id/settings',
                component: () => import('src/pages/GuildPageSettings.vue'),
                children: [
                    { path: '', component: () => import('src/pages/GuildPageSettingsGeneral.vue') },
                    {
                        path: 'diamond',
                        component: () => import('src/pages/GuildPageSettingsLacunaDiamond.vue')
                    },
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
            if (to.query.code || to.query.error || to.query.close === 'true') {
                window.opener.postMessage(to.query, window.location.origin)
            }
        }
    },

    {
        path: '/auth',
        children: [
            {
                path: '',
                component: () => import('pages/AuthorizationPage.vue')
            }
        ]
    },

    {
        path: '/:catchAll(.*)*',
        component: () => import('pages/ErrorNotFound.vue')
    }
]

export default routes
