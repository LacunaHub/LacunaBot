import Router from '@koa/router'
import { authenticate } from '../../utility/Authentication'
import cancelPayment from './methods/CancelPayment'
import chargePayment from './methods/ChargePayment'
import createPayment from './methods/CreatePayment'

const router = new Router({ prefix: '/payments', methods: ['GET', 'POST'] })

router.post('/', authenticate, createPayment)
router.get('/charge', chargePayment)
router.get('/cancel', cancelPayment)

export default router
