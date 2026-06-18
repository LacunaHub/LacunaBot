import Router from '@koa/router'
import getState from '../common/methods/GetState.js'

const router = new Router({ prefix: '/state', methods: ['GET'] })

router.get('/', getState)

export default router
