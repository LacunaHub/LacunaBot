import { authenticate } from '@/api/utility/Authentication.js'
import { createRateLimit } from '@/api/utility/Utils.js'
import Router from '@koa/router'
import getCurrentUser from './methods/GetCurrentUser.js'
import getCurrentUserActivities from './methods/GetCurrentUserActivities.js'
import getCurrentUserSubmittedReports from './methods/GetCurrentUserSubmittedReports.js'
import getUserBans from './methods/GetUserBans.js'
import getUserReports from './methods/GetUserReports.js'

const router = new Router({ prefix: '/users', methods: ['GET'] })

router.get('/@me', createRateLimit(5), authenticate, getCurrentUser)
router.get('/@me/activities', createRateLimit(5), authenticate, getCurrentUserActivities)
router.get('/@me/submitted-reports', createRateLimit(5), authenticate, getCurrentUserSubmittedReports)
router.get('/:userId/bans', createRateLimit(10), authenticate, getUserBans)
router.get('/:userId/reports', createRateLimit(10), authenticate, getUserReports)

export default router
