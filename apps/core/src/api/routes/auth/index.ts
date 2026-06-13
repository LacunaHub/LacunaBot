import Router from '@koa/router'
import { createRateLimit } from '../../utility/Utils'
import exchangeCode from './methods/ExchangeCode'
import getAuthURI from './methods/GetAuthURI'
import getBotAuthURI from './methods/GetBotAuthURI'

const router = new Router({ prefix: '/auth', methods: ['GET'] })

router.get('/', createRateLimit(10), getAuthURI)
router.get('/bot', createRateLimit(10), getBotAuthURI)
router.post('/exchange-code', createRateLimit(10), exchangeCode)

export default router
