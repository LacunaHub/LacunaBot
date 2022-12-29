import Router from '@koa/router'
import { Context } from 'koa'
import db from '../../../database'
import OAuth2 from '../discord/OAuth2'

const router: Router = new Router({ prefix: '/authorize', methods: ['GET'] })
const oauth = new OAuth2(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET)

router.get('/', authorize)
router.get('/callback', callback)
router.get('/add', addBot)

async function authorize(ctx: Context) {
    const data = {
        client_id: oauth.client_id,
        redirect_uri: encodeURIComponent(process.env.CLIENT_OAUTH2_REDIRECT_URI),
        scope: encodeURIComponent('identify guilds')
    }

    ctx.redirect(
        `https://discord.com/oauth2/authorize?client_id=${data.client_id}&redirect_uri=${data.redirect_uri}&response_type=code&scope=${data.scope}`
    )
}

async function callback(ctx: Context) {
    if (ctx.query.error) {
        ctx.redirect(process.env.WEBSITE_URL)

        return
    }

    const auth = await oauth.requestToken(ctx.query.code as string)
    const user = await oauth.getUser(auth.access_token)

    const cookieOptions = {
        maxAge: auth.expires_in * 1000,
        domain: process.env.WEBSITE_DOMAIN,
        httpOnly: false
    }

    ctx.cookies.set('access_token', auth.access_token, cookieOptions)

    ctx.cookies
        .set('user_id', user.id, cookieOptions)
        .set('user_username', encodeURIComponent(user.username), cookieOptions)
        .set('user_discriminator', user.discriminator, cookieOptions)

    if (user.avatar) ctx.cookies.set('user_avatar', user.avatar, cookieOptions)

    const entry = await db.users.findOne({ _id: user.id })

    if (!entry) {
        await db.users.create({
            _id: user.id,
            user: {
                username: user.username,
                discriminator: user.discriminator,
                avatar: user.avatar,
                flags: user.public_flags
            }
        } as any)
    } else {
        if (entry.user.avatar !== user.avatar) {
            await db.users.updateOne({ _id: user.id }, { $set: { 'user.avatar': user.avatar } })
        }

        if (entry.user.discriminator !== user.discriminator) {
            await db.users.updateOne({ _id: user.id }, { $set: { 'user.discriminator': user.discriminator } })
        }

        if (entry.user.flags !== user.public_flags) {
            await db.users.updateOne({ _id: user.id }, { $set: { 'user.flags': user.public_flags } })
        }

        if (entry.user.username !== user.username) {
            await db.users.updateOne({ _id: user.id }, { $set: { 'user.username': user.username } })
        }
    }

    ctx.redirect(ctx.query.guild_id ? `${process.env.WEBSITE_URL}/guilds/${ctx.query.guild_id}/settings` : `${process.env.WEBSITE_URL}/@me/guilds`)
}

async function addBot(ctx: Context) {
    const query = new URLSearchParams(ctx.query as any).toString()

    ctx.redirect(`https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=997584094&${query}`)
}

export default router
