import Router from '@koa/router'
import { PermissionsBitField, RESTAPIPartialCurrentUserGuild } from 'discord.js'
import { Context } from 'koa'
import db from '../../../database'
import { UserDocument } from '../../../database/schemas/Users'
import DiscordUtils from '../../utility/DiscordUtils'
import DiscordOAuth2 from '../discord/OAuth2'
import { authorize } from '../utility/Authorize'
import { createRateLimitMiddleware } from '../utility/Utils'

const router: Router = new Router({ prefix: '/users' })
const OAuth2 = new DiscordOAuth2(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET)

router.use(createRateLimitMiddleware(10, 150000))

router.get('/@me', authorize, getMe)
router.get('/@me/bills', authorize, getBills)
router.get('/@me/activities', authorize, getActivities)
router.get('/patrons', getPatrons)

async function getMe(ctx: Context) {
    const user_id = ctx.request.headers['user-id'] as string
    if (!user_id) ctx.throw(400)

    const user: UserDocument = await db.users.findOne({ _id: user_id })
    if (!user) ctx.throw(404)

    let guilds: RESTAPIPartialCurrentUserGuild[]

    try {
        guilds = await OAuth2.getUserGuilds(ctx.request.headers.authorization)
    } catch (err) {}

    if (!guilds) ctx.throw(400)

    for (const guild of guilds) {
        const permissions = new PermissionsBitField(BigInt(guild.permissions))
        const permitted = guild.owner || permissions.has(PermissionsBitField.Flags.Administrator)

        if (permitted) {
            let me: any

            try {
                me = await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildMember(guild.id, process.env.DISCORD_CLIENT_ID))
            } catch (err) {}

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

async function getPatrons(ctx: Context) {
    const patrons = await db.users.find({ 'premium.last_charge_timestamp': { $ne: null } })
    const bills = await db.bills.find({
        type: { $in: ['QIWI', 'PAYPAL'] },
        'status.value': 'PAID',
        'custom_fields.user_id': { $in: patrons.map(i => i._id) }
    })

    ctx.status = 200
    ctx.body = patrons.map(i => {
        const userBills = bills.filter(ii => ii.custom_fields.user_id === i._id)
        const supportedAmount = userBills.reduce(
            (x, y) => {
                x[y.currency] += y.amount
                return x
            },
            { RUB: 0, USD: 0 }
        )

        return {
            _id: i._id,
            avatar: i.user.avatar,
            username: i.user.username,
            is_active: i.premium.available,
            is_big_patron: supportedAmount.RUB >= 1000 || supportedAmount.USD >= 15
        }
    })
}

export default router
