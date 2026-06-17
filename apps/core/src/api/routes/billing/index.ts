import { authenticate } from '@/api/utility/Authentication.js'
import Router from '@koa/router'
import cancelPayment from './methods/CancelPayment.js'
import chargePayment from './methods/ChargePayment.js'
import createPayment from './methods/CreatePayment.js'
import createSubscription from './methods/CreateSubscription.js'

const router = new Router({ prefix: '/billing', methods: ['GET', 'POST'] })

router.post('/payments', authenticate, createPayment)
router.get('/payments/charge', chargePayment)
router.get('/payments/cancel', cancelPayment)
router.post('/subscriptions', authenticate, createSubscription)

export default router
