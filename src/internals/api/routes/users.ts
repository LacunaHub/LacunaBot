import Router from '@koa/router'
import { PermissionsBitField } from 'discord.js'
import { Context } from 'koa'
import db from '../../../database'
import { UserDocument } from '../../../database/schemas/Users'
import DiscordUtils from '../../utility/DiscordUtils'
import OAuth2, { OAuth2Guild } from '../discord/OAuth2'
import { authorize } from '../utility/Authorize'

const router: Router = new Router({ prefix: '/users' })
const oauth = new OAuth2(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET)

router.get('/@me', authorize, getMe)
router.get('/@me/bills', authorize, getBills)
router.get('/@me/activities', authorize, getActivities)

async function getMe(ctx: Context) {
    const user_id = ctx.request.headers['user-id'] as string
    if (!user_id) ctx.throw(400)

    const user: UserDocument = await db.users.findOne({ _id: user_id })
    if (!user) ctx.throw(404)

    const guilds = (await oauth.getUserGuilds(ctx.request.headers.authorization).catch(() => {})) as OAuth2Guild[]
    if (!guilds) ctx.throw(400)

    for (const guild of guilds) {
        const permissions = new PermissionsBitField(BigInt(guild.permissions))
        const permitted = guild.owner || permissions.has(PermissionsBitField.Flags.Administrator)

        if (permitted) {
            const me = (await DiscordUtils.restApi
                .get(DiscordUtils.apiRoutes.guildMember(guild.id, process.env.DISCORD_CLIENT_ID))
                .catch(() => {})) as any

            guild['joined'] = Boolean(me)
        }

        guild['permitted'] = permitted
    }

    ctx.status = 200
    ctx.body = {
        user: {
            id: user._id,
            ...user.user
        },
        guilds
    }
}

async function getBills(ctx: Context) {
    const user_id = ctx.request.headers['user-id'] as string
    if (!user_id) ctx.throw(400)

    const bills = await db.bills.find({ 'custom_fields.user_id': user_id, type: { $ne: 'DISCORD_NITRO_BOOST' } })

    ctx.status = 200
    ctx.body = bills.reverse()
}

async function getActivities(ctx: Context) {
    const user_id = ctx.request.headers['user-id'] as string
    if (!user_id) ctx.throw(400)

    const user = await db.users.findOne({ _id: user_id })
    if (!user) ctx.throw(404)

    ctx.status = 200
    ctx.body = {
        levels: user.activities.levels
    }
}

export default router
