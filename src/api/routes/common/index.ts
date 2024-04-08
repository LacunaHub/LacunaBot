import Router from '@koa/router'
import { authenticate } from '../../utility/Authentication'
import { createRateLimit } from '../../utility/Utils'
import getDiamondPrices from './methods/GetDiamondPrices'
import getPlugin from './methods/GetPlugin'
import getPlugins from './methods/GetPlugins'
import getReleaseNotes from './methods/GetReleaseNotes'
import getVersion from './methods/GetVersion'

const router = new Router({ prefix: '/common' })

router.get('/diamond-prices', createRateLimit(100), getDiamondPrices)
router.get('/plugins', createRateLimit(10), authenticate, getPlugins)
router.get('/plugins/:repoOwner/:repoName', createRateLimit(10), authenticate, getPlugin)
router.get('/release-notes', createRateLimit(100), getReleaseNotes)
router.get('/version', createRateLimit(100), getVersion)

export default router
