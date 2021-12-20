import Router from '@koa/router'
import { Permissions } from 'discord.js'
import { Context } from 'koa'
import db from '../../../database'
import { UserDocument } from '../../../database/schemas/Users'
import { sharding } from '../../../index'
import OAuth2 from '../discord/OAuth2'
import { authorize } from '../utility/Authorize'

const router: Router = new Router({ prefix: '/users' })
const oauth = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

router.get('/@me', authorize, getMe)

async function getMe(ctx: Context) {
    const user_id = ctx.request.headers['user-id'] as string

    if (!user_id) {
        ctx.status = 400; ctx.body = 'Bad Request'

        return
    }

    const user: UserDocument = await db.users.findOne({ _id: user_id })

    if (!user) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    let guilds = await oauth.getUserGuilds(ctx.request.headers.authorization).catch(() => {})

    if (!guilds) {
        ctx.status = 400; ctx.body = 'Bad Request'

        return
    }

    guilds = guilds.filter(g => {
        const permissions = new Permissions(BigInt(g.permissions))

        return g.owner || permissions.has('ADMINISTRATOR')
    })

    for (const guild of guilds) {
        const joined = await sharding.broadcastEval((self, ctx) => {
            return self.guilds.cache.has(ctx.guild.id)
        }, { context: { guild } })

        guild.joined = joined.some(i => i)
    }

    ctx.status = 200
    ctx.body = {
        user: {
            id: user._id,
            flags: user.flags,
            ...user.user
        },
        guilds: guilds
    }
}

export default router