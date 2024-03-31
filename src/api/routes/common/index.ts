import Router from '@koa/router'
import { authenticate } from '../../utility/Authentication'
import { createRateLimit } from '../../utility/Utils'
import getDiamondPrices from './methods/GetDiamondPrices'
import getPlugin from './methods/GetPlugin'
import getPlugins from './methods/GetPlugins'

const router = new Router({ prefix: '/common' })

router.get('/diamond-prices', createRateLimit(10), getDiamondPrices)
router.get('/plugins', createRateLimit(10), authenticate, getPlugins)
router.get('/plugins/:repoOwner/:repoName', createRateLimit(10), authenticate, getPlugin)

export default router
