import { findServer } from '@/api/utility/Middlewares.js'
import { createRateLimit } from '@/api/utility/Utils.js'
import Router from '@koa/router'
import { authenticate, checkPermissions, identify } from '../../utility/Authentication.js'
import getGuild from './methods/GetGuild.js'
import getLeaders from './methods/GetLeaders.js'
import getSettings from './methods/GetSettings.js'
import updateSettings from './methods/UpdateSettings.js'
import createAutoVoice from './methods/auto-voices/CreateAutoVoice.js'
import deleteAutoVoice from './methods/auto-voices/DeleteAutoVoice.js'
import updateAutoVoice from './methods/auto-voices/UpdateAutoVoice.js'
import createCustomCommand from './methods/custom-commands/CreateCustomCommand.js'
import deleteCustomCommand from './methods/custom-commands/DeleteCustomCommand.js'
import updateCustomCommand from './methods/custom-commands/UpdateCustomCommand.js'
import createDAMERule from './methods/dame-rules/CreateDAMERule.js'
import deleteDAMERule from './methods/dame-rules/DeleteDAMERule.js'
import updateDAMERule from './methods/dame-rules/UpdateDAMERule.js'
import createInteractiveMessage from './methods/interactive-messages/CreateInteractiveMessage.js'
import deleteInteractiveMessage from './methods/interactive-messages/DeleteInteractiveMessage.js'
import updateInteractiveMessage from './methods/interactive-messages/UpdateInteractiveMessage.js'
import createInteractiveReaction from './methods/interactive-reactions/CreateInteractiveReaction.js'
import deleteInteractiveReaction from './methods/interactive-reactions/DeleteInteractiveReaction.js'
import updateInteractiveReaction from './methods/interactive-reactions/UpdateInteractiveReaction.js'
import createTelegramSubscription from './methods/social-alerts/CreateTelegramSubscription.js'
import createTwitchSubscription from './methods/social-alerts/CreateTwitchSubscription.js'
import createYouTubeSubscription from './methods/social-alerts/CreateYouTubeSubscription.js'
import deleteTelegramSubscription from './methods/social-alerts/DeleteTelegramSubscription.js'
import deleteTwitchSubscription from './methods/social-alerts/DeleteTwitchSubscription.js'
import deleteYouTubeSubscription from './methods/social-alerts/DeleteYouTubeSubscription.js'
import updateTelegramSubscription from './methods/social-alerts/UpdateTelegramSubscription.js'
import updateTwitchSubscription from './methods/social-alerts/UpdateTwitchSubscription.js'
import updateYouTubeSubscription from './methods/social-alerts/UpdateYouTubeSubscription.js'

const router = new Router({ prefix: '/guilds' })

router.get('/:guildId', createRateLimit(5), findServer, getGuild)
router.get('/:guildId/leaders', createRateLimit(10), identify, findServer, getLeaders)
router.get('/:guildId/settings', createRateLimit(10), authenticate, checkPermissions, findServer, getSettings)
router.post('/:guildId/settings', createRateLimit(10), authenticate, checkPermissions, findServer, updateSettings)

router.post(
    '/:guildId/settings/auto-voices',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    createAutoVoice
)
router.delete(
    '/:guildId/settings/auto-voices/:avId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    deleteAutoVoice
)
router.patch(
    '/:guildId/settings/auto-voices/:avId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    updateAutoVoice
)

router.post(
    '/:guildId/settings/custom-commands',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    createCustomCommand
)
router.delete(
    '/:guildId/settings/custom-commands/:cid',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    deleteCustomCommand
)
router.patch(
    '/:guildId/settings/custom-commands/:cid',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    updateCustomCommand
)

router.post(
    '/:guildId/settings/dame-rules',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    createDAMERule
)
router.delete(
    '/:guildId/settings/dame-rules/:ruleId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    deleteDAMERule
)
router.patch(
    '/:guildId/settings/dame-rules/:ruleId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    updateDAMERule
)

router.post(
    '/:guildId/settings/interactive-messages',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    createInteractiveMessage
)
router.delete(
    '/:guildId/settings/interactive-messages/:imId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    deleteInteractiveMessage
)
router.patch(
    '/:guildId/settings/interactive-messages/:imId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    updateInteractiveMessage
)

router.post(
    '/:guildId/settings/interactive-reactions',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    createInteractiveReaction
)
router.delete(
    '/:guildId/settings/interactive-reactions/:irId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    deleteInteractiveReaction
)
router.patch(
    '/:guildId/settings/interactive-reactions/:irId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    updateInteractiveReaction
)

router.post(
    '/:guildId/settings/social-alerts/telegram',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    createTelegramSubscription
)
router.post(
    '/:guildId/settings/social-alerts/twitch',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    createTwitchSubscription
)
router.post(
    '/:guildId/settings/social-alerts/youtube',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    createYouTubeSubscription
)
router.delete(
    '/:guildId/settings/social-alerts/telegram/:channelId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    deleteTelegramSubscription
)
router.delete(
    '/:guildId/settings/social-alerts/twitch/:channelId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    deleteTwitchSubscription
)
router.delete(
    '/:guildId/settings/social-alerts/youtube/:channelId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    deleteYouTubeSubscription
)
router.patch(
    '/:guildId/settings/social-alerts/telegram/:channelId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    updateTelegramSubscription
)
router.patch(
    '/:guildId/settings/social-alerts/twitch/:channelId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    updateTwitchSubscription
)
router.patch(
    '/:guildId/settings/social-alerts/youtube/:channelId',
    createRateLimit(5),
    authenticate,
    checkPermissions,
    findServer,
    updateYouTubeSubscription
)

export default router
