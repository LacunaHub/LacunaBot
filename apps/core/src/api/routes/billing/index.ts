import Router from '@koa/router'
import { authenticate } from '../../utility/Authentication'
import cancelPayment from './methods/CancelPayment'
import chargePayment from './methods/ChargePayment'
import createPayment from './methods/CreatePayment'
import createSubscription from './methods/CreateSubscription'

const router = new Router({ prefix: '/billing', methods: ['GET', 'POST'] })

router.post('/payments', authenticate, createPayment)
router.get('/payments/charge', chargePayment)
router.get('/payments/cancel', cancelPayment)
router.post('/subscriptions', authenticate, createSubscription)

export default router
