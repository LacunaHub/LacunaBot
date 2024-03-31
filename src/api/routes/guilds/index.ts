import Router from '@koa/router'
import { authenticate, checkPermissions } from '../../utility/Authentication'
import { createRateLimit } from '../../utility/Utils'
import downloadLogs from './methods/DownloadLogs'
import getSettings from './methods/GetSettings'
import transferDiamond from './methods/TransferDiamond'
import updateAutoVoice from './methods/UpdateAutoVoice'
import updateCustomCommand from './methods/UpdateCustomCommand'
import updateInteractiveMessage from './methods/UpdateInteractiveMessage'
import updateInteractiveReaction from './methods/UpdateInteractiveReaction'
import updateSettings from './methods/UpdateSettings'
import updateTelegramSocialAlert from './methods/UpdateTelegramSocialAlert'
import updateTwitchSocialAlert from './methods/UpdateTwitchSocialAlert'
import updateYouTubeSocialAlert from './methods/UpdateYouTubeSocialAlert'

const router = new Router({ prefix: '/guilds' })

router.get('/:guild_id/settings', createRateLimit(10), authenticate, checkPermissions, getSettings)
router.post('/:guild_id/settings', createRateLimit(10), authenticate, checkPermissions, updateSettings)
router.post('/:guild_id/custom-commands/:method', createRateLimit(5), authenticate, checkPermissions, updateCustomCommand)
router.post('/:guild_id/interactive-messages/:method', createRateLimit(5), authenticate, checkPermissions, updateInteractiveMessage)
router.post('/:guild_id/reactions/:method', createRateLimit(5), authenticate, checkPermissions, updateInteractiveReaction)
router.post('/:guild_id/subscriptions/telegram/:method', createRateLimit(5), authenticate, checkPermissions, updateTelegramSocialAlert)
router.post('/:guild_id/subscriptions/twitch/:method', createRateLimit(5), authenticate, checkPermissions, updateTwitchSocialAlert)
router.post('/:guild_id/subscriptions/youtube/:method', createRateLimit(5), authenticate, checkPermissions, updateYouTubeSocialAlert)
router.post('/:guild_id/autovoices/:method', createRateLimit(5), authenticate, checkPermissions, updateAutoVoice)
router.post('/:guild_id/transfer-diamond/:to_guild_id', createRateLimit(1, 1000 * 60 * 5), authenticate, transferDiamond)
router.post('/:guild_id/download-logs', createRateLimit(5), authenticate, checkPermissions, downloadLogs)

export default router
