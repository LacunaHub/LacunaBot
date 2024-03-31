import Router from '@koa/router'
import getState from './methods/GetState'

const router = new Router({ prefix: '/state', methods: ['GET'] })

router.get('/', getState)

export default router
