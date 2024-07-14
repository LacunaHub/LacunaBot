import Router from '@koa/router'
import { authenticate } from '../../utility/Authentication'
import { createRateLimit } from '../../utility/Utils'
import handleGitHubWebhook, { verifyGitHubSignature } from './methods/HandleGitHubWebhook'
import handleTelegramWebhook from './methods/HandleTelegramWebhook'
import handleTopGGWebhook from './methods/HandleTopGGWebhook'
import handleTwitchWebhook, { authenticateEventSub } from './methods/HandleTwitchWebhook'
import handleYouTubeWebhook from './methods/HandleYouTubeWebhook'
import handleYouTubeWebhookChallenge from './methods/HandleYouTubeWebhookChallenge'
import searchTelegramChannels from './methods/SearchTelegramChannels'
import searchTwitchChannels from './methods/SearchTwitchChannels'
import searchYouTubeChannels from './methods/SearchYouTubeChannels'

const router = new Router({ methods: ['GET', 'POST'] })

router.get('/subscriptions/telegram/search', createRateLimit(5), authenticate, searchTelegramChannels)
router.get('/subscriptions/twitch/search', createRateLimit(5, 1000 * 60 * 2), authenticate, searchTwitchChannels)
router.get('/subscriptions/youtube/search', createRateLimit(5, 1000 * 60 * 5), authenticate, searchYouTubeChannels)
router.post('/subscriptions/twitch/eventsub-webhook', authenticateEventSub, handleTwitchWebhook)
router.get('/subscriptions/youtube/hubbub-webhook', handleYouTubeWebhookChallenge)
router.post('/subscriptions/youtube/hubbub-webhook', handleYouTubeWebhook)
router.post('/subscriptions/telegram/webhook', handleTelegramWebhook)
router.post('/webhooks/github', verifyGitHubSignature, handleGitHubWebhook)
router.post('/webhooks/top-gg', handleTopGGWebhook)

export default router
