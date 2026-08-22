import { authenticate } from '@/api/utility/Authentication.js'
import { createRateLimit } from '@/api/utility/Utils.js'
import Router from '@koa/router'
import getMetrics from './methods/GetMetrics.js'
import getPlugin from './methods/GetPlugin.js'
import getPlugins from './methods/GetPlugins.js'
import getState from './methods/GetState.js'
import getVersion from './methods/GetVersion.js'

const router = new Router({ prefix: '/common', methods: ['GET'] })

router.get('/metrics', createRateLimit(25, 1000 * 60 * 2), getMetrics)
router.get('/plugins', createRateLimit(10), authenticate, getPlugins)
router.get('/plugins/:repoOwner/:repoName', createRateLimit(10), authenticate, getPlugin)
router.get('/state', createRateLimit(25), getState)
router.get('/version', createRateLimit(100), getVersion)

export default router
