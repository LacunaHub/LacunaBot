import Router from '@koa/router'
import { authenticate } from '../../utility/Authentication'
import { createRateLimit } from '../../utility/Utils'
import getCurrentUser from './methods/GetCurrentUser'
import getCurrentUserActivities from './methods/GetCurrentUserActivities'
import getCurrentUserBills from './methods/GetCurrentUserBills'
import getCurrentUserDiamondGuilds from './methods/GetCurrentUserDiamondGuilds'
import getCurrentUserSubmittedReports from './methods/GetCurrentUserSubmittedReports'
import getPatrons from './methods/GetPatrons'
import getUserBans from './methods/GetUserBans'
import getUserReports from './methods/GetUserReports'

const router = new Router({ prefix: '/users', methods: ['GET'] })

router.get('/@me', createRateLimit(5), authenticate, getCurrentUser)
router.get('/@me/activities', createRateLimit(5), authenticate, getCurrentUserActivities)
router.get('/@me/bills', createRateLimit(5), authenticate, getCurrentUserBills)
router.get('/@me/diamond-guilds', createRateLimit(5), authenticate, getCurrentUserDiamondGuilds)
router.get('/@me/submitted-reports', createRateLimit(5), authenticate, getCurrentUserSubmittedReports)
router.get('/patrons', createRateLimit(5), getPatrons)
router.get('/:userId/bans', createRateLimit(10), authenticate, getUserBans)
router.get('/:userId/reports', createRateLimit(10), authenticate, getUserReports)

export default router
