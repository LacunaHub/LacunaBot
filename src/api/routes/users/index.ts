import Router from '@koa/router'
import { authenticate } from '../../utility/Authentication'
import { createRateLimit } from '../../utility/Utils'
import getCurrentUser from './methods/GetCurrentUser'
import getCurrentUserActivities from './methods/GetCurrentUserActivities'
import getCurrentUserBills from './methods/GetCurrentUserBills'
import getCurrentUserDiamondGuilds from './methods/GetCurrentUserDiamondGuilds'
import getPatrons from './methods/GetPatrons'

const router = new Router({ prefix: '/users', methods: ['GET'] })

router.get('/@me', createRateLimit(5), authenticate, getCurrentUser)
router.get('/@me/activities', createRateLimit(5), authenticate, getCurrentUserActivities)
router.get('/@me/bills', createRateLimit(5), authenticate, getCurrentUserBills)
router.get('/@me/diamond-guilds', createRateLimit(5), authenticate, getCurrentUserDiamondGuilds)
router.get('/patrons', createRateLimit(5), getPatrons)

export default router
