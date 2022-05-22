import Router from '@koa/router'
import { Permissions } from 'discord.js'
import { Context } from 'koa'
import db from '../../../database'
import { UserDocument } from '../../../database/schemas/Users'
import DiscordUtils from '../../utility/DiscordUtils'
import OAuth2, { OAuth2Guild } from '../discord/OAuth2'
import { authorize } from '../utility/Authorize'

const router: Router = new Router({ prefix: '/users' })
const oauth = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

router.get('/@me', authorize, getMe)
router.get('/bills', authorize, getBills)

async function getMe(ctx: Context) {
    const user_id = ctx.request.headers['user-id'] as string
    if (!user_id) ctx.throw(400)

    const user: UserDocument = await db.users.findOne({ _id: user_id })
    if (!user) ctx.throw(404)

    const guilds = (await oauth.getUserGuilds(ctx.request.headers.authorization).catch(() => {})) as OAuth2Guild[]
    if (!guilds) ctx.throw(400)

    const accessibleGuilds = guilds.filter(g => {
        const permissions = new Permissions(BigInt(g.permissions))

        return g.owner || permissions.has('ADMINISTRATOR')
    })

    for (const guild of accessibleGuilds) {
        const me = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildMember(guild.id, process.env.CLIENT_ID)).catch(() => {})) as any

        guild['joined'] = Boolean(me)
    }

    ctx.status = 200
    ctx.body = {
        user: {
            id: user._id,
            ...user.user
        },
        guilds: guilds
    }
}

async function getBills(ctx: Context) {
    const user_id = ctx.request.headers['user-id'] as string
    if (!user_id) ctx.throw(400)

    const bills = await db.bills.find({ 'custom_fields.user_id': user_id })

    ctx.status = 200
    ctx.body = bills
}

export default router
