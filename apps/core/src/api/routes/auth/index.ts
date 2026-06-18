import Router from '@koa/router'
import { createRateLimit } from '../../utility/Utils.js'
import exchangeCode from './methods/ExchangeCode.js'
import getAuthURI from './methods/GetAuthURI.js'
import getBotAuthURI from './methods/GetBotAuthURI.js'

const router = new Router({ prefix: '/auth', methods: ['GET'] })

router.get('/', createRateLimit(10), getAuthURI)
router.get('/bot', createRateLimit(10), getBotAuthURI)
router.post('/exchange-code', createRateLimit(10), exchangeCode)

export default router
