import Router from '@koa/router'
import { authenticate } from '../../utility/Authentication'
import { createRateLimit } from '../../utility/Utils'
import getDiamondPrices from './methods/GetDiamondPrices'
import getMetrics from './methods/GetMetrics'
import getPlugin from './methods/GetPlugin'
import getPlugins from './methods/GetPlugins'
import getReleaseNotes from './methods/GetReleaseNotes'
import getState from './methods/GetState'
import getVersion from './methods/GetVersion'

const router = new Router({ prefix: '/common', methods: ['GET'] })

router.get('/diamond-prices', createRateLimit(100), getDiamondPrices)
router.get('/metrics', createRateLimit(25, 1000 * 60 * 2), getMetrics)
router.get('/plugins', createRateLimit(10), authenticate, getPlugins)
router.get('/plugins/:repoOwner/:repoName', createRateLimit(10), authenticate, getPlugin)
router.get('/release-notes', createRateLimit(100), getReleaseNotes)
router.get('/state', createRateLimit(25), getState)
router.get('/version', createRateLimit(100), getVersion)

export default router
