import Router from '@koa/router'
import authorize from './methods/Authorize'
import getAuthURL from './methods/GetAuthURL'
import getBotAuthURL from './methods/GetBotAuthURL'
import getLinkedRolesAuthURL from './methods/GetLinkedRolesAuthURL'
import updateLinkedRoles from './methods/UpdateLinkedRoles'

const router = new Router({ prefix: '/authorize', methods: ['GET'] })

router.get('/', getAuthURL)
router.get('/callback', authorize)
router.get('/add', getBotAuthURL)
router.get('/linked-roles', getLinkedRolesAuthURL)
router.get('/linked-roles/callback', updateLinkedRoles)

export default router
