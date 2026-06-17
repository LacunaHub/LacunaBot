import Router from '@koa/router'
import authorize from './methods/Authorize.js'
import getAuthURL from './methods/GetAuthURL.js'
import getBotAuthURL from './methods/GetBotAuthURL.js'
import getLinkedRolesAuthURL from './methods/GetLinkedRolesAuthURL.js'
import updateLinkedRoles from './methods/UpdateLinkedRoles.js'

const router = new Router({ prefix: '/authorize', methods: ['GET'] })

router.get('/', getAuthURL)
router.get('/callback', authorize)
router.get('/add', getBotAuthURL)
router.get('/linked-roles', getLinkedRolesAuthURL)
router.get('/linked-roles/callback', updateLinkedRoles)

export default router
