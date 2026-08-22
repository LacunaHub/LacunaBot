import { authenticate } from '@/api/utility/Authentication.js'
import { createRateLimit } from '@/api/utility/Utils.js'
import Router from '@koa/router'
import handleTelegramWebhook from './methods/HandleTelegramWebhook.js'
import handleTwitchWebhook, { authenticateEventSub } from './methods/HandleTwitchWebhook.js'
import handleYouTubeWebhook from './methods/HandleYouTubeWebhook.js'
import handleYouTubeWebhookChallenge from './methods/HandleYouTubeWebhookChallenge.js'
import searchTelegramChannels from './methods/SearchTelegramChannels.js'
import searchTwitchChannels from './methods/SearchTwitchChannels.js'
import searchYouTubeChannels from './methods/SearchYouTubeChannels.js'

const router = new Router({ methods: ['GET', 'POST'] })

router.get('/subscriptions/telegram/search', createRateLimit(5), authenticate, searchTelegramChannels)
router.get('/subscriptions/twitch/search', createRateLimit(5, 1000 * 60 * 2), authenticate, searchTwitchChannels)
router.get('/subscriptions/youtube/search', createRateLimit(5, 1000 * 60 * 5), authenticate, searchYouTubeChannels)
router.post('/subscriptions/twitch/eventsub-webhook', authenticateEventSub, handleTwitchWebhook)
router.get('/subscriptions/youtube/hubbub-webhook', handleYouTubeWebhookChallenge)
router.post('/subscriptions/youtube/hubbub-webhook', handleYouTubeWebhook)
router.post('/subscriptions/telegram/webhook', handleTelegramWebhook)

export default router
