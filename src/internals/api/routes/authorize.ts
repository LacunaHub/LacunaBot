import Router from '@koa/router'
import { APIUser, OAuth2Scopes, RESTPostOAuth2AccessTokenResult, SnowflakeUtil } from 'discord.js'
import { Context } from 'koa'
import db from '../../../database'
import DiscordOAuth2 from '../discord/OAuth2'

const router: Router = new Router({ prefix: '/authorize', methods: ['GET'] })
const OAuth2 = new DiscordOAuth2(process.env.LCN_DISCORD_CLIENT_ID, process.env.LCN_DISCORD_CLIENT_SECRET)

router.get('/', authorize)
router.get('/callback', callback)
router.get('/add', addBot)
router.get('/linked-roles', linkedRoles)
router.get('/linked-roles/callback', linkedRolesCallback)

async function authorize(ctx: Context) {
    const { url, state } = OAuth2.getOAuthURL([OAuth2Scopes.Identify, OAuth2Scopes.Guilds])

    ctx.cookies.set('discord_oauth_state', state, { maxAge: 5 * 60 * 1000, signed: true })
    ctx.redirect(url.toString())
}

async function callback(ctx: Context) {
    if (ctx.query.error) {
        ctx.redirect(`${process.env.WEBSITE_URL}/authorization?status=failed`)

        return
    }

    const code = ctx.query.code as string,
        state = ctx.query.state as string,
        savedState = ctx.cookies.get('discord_oauth_state')

    if (state !== savedState) {
        ctx.redirect(`${process.env.WEBSITE_URL}/authorization?status=failed`)

        return
    }

    let exchangedCode: RESTPostOAuth2AccessTokenResult
    let currentUser: APIUser

    try {
        exchangedCode = await OAuth2.exchangeCode(code)
        currentUser = await OAuth2.getUser(exchangedCode.access_token)
    } catch (err) {
        ctx.redirect(`${process.env.WEBSITE_URL}/authorization?status=failed`)

        return
    }

    const userEntry = await db.users.findOne({ _id: currentUser.id })
    const cookieOptions = {
        maxAge: exchangedCode.expires_in * 1000,
        domain: process.env.LCN_WEBSITE_DOMAIN,
        httpOnly: false
    }

    ctx.cookies
        .set('access_token', exchangedCode.access_token, cookieOptions)
        .set('refresh_token', exchangedCode.refresh_token, { domain: process.env.LCN_WEBSITE_DOMAIN, httpOnly: false })

    ctx.cookies
        .set('user_id', currentUser.id, cookieOptions)
        .set('user_username', currentUser.username, cookieOptions)
        .set('user_global_name', encodeURIComponent(currentUser.global_name), cookieOptions)

    if (currentUser.avatar) ctx.cookies.set('user_avatar', currentUser.avatar, cookieOptions)

    if (userEntry) {
        const updateData = {}

        if (userEntry.user.username !== currentUser.username) {
            updateData['user.username'] = currentUser.username
        }

        if (userEntry.user.discriminator !== currentUser.discriminator) {
            updateData['user.discriminator'] = currentUser.discriminator
        }

        if (userEntry.user.avatar !== currentUser.avatar) {
            updateData['user.avatar'] = currentUser.avatar
        }

        if (userEntry.user.flags !== currentUser.public_flags) {
            updateData['user.flags'] = currentUser.public_flags
        }

        if (userEntry.user.global_name !== currentUser.global_name) {
            updateData['user.global_name'] = currentUser.global_name
        }

        if (Object.keys(updateData).length) {
            await db.users.updateOne(
                { _id: currentUser.id },
                {
                    $set: updateData
                }
            )

            await OAuth2.updateUserRoleConnection(exchangedCode.access_token, {
                platform_name: 'Lacuna',
                metadata: {
                    account_created_at: new Date(SnowflakeUtil.timestampFrom(currentUser.id)).toISOString()
                }
            })
        }
    } else {
        await db.users.create({
            _id: currentUser.id,
            user: {
                username: currentUser.username,
                discriminator: currentUser.discriminator,
                avatar: currentUser.avatar,
                flags: currentUser.public_flags,
                global_name: currentUser.global_name
            }
        })
    }

    ctx.redirect(ctx.query.guild_id ? `${process.env.WEBSITE_URL}/guilds/${ctx.query.guild_id}/settings` : `${process.env.WEBSITE_URL}/@me/guilds`)
}

async function addBot(ctx: Context) {
    const url = new URL(OAuth2.baseAuthorizationURL)

    url.searchParams.append('client_id', OAuth2.clientId)
    url.searchParams.append('permissions', '997584094')

    for (const i in ctx.query) {
        url.searchParams.append(i, ctx.query[i] as any)
    }

    ctx.redirect(url.toString())
}

async function linkedRoles(ctx: Context) {
    const { url, state } = OAuth2.getOAuthURL(
        [OAuth2Scopes.RoleConnectionsWrite, OAuth2Scopes.Identify],
        `${process.env.API_URL}/authorize/linked-roles/callback`
    )

    ctx.cookies.set('discord_oauth_state', state, { maxAge: 5 * 60 * 1000, signed: true })
    ctx.redirect(url.toString())
}

async function linkedRolesCallback(ctx: Context) {
    const code = ctx.query.code as string,
        state = ctx.query.state as string,
        savedState = ctx.cookies.get('discord_oauth_state')

    if (state !== savedState) {
        ctx.redirect(`${process.env.WEBSITE_URL}/authorization?status=failed`)

        return
    }

    let exchangedCode: RESTPostOAuth2AccessTokenResult
    let currentUser: APIUser

    try {
        exchangedCode = await OAuth2.exchangeCode(code, `${process.env.API_URL}/authorize/linked-roles/callback`)
        currentUser = await OAuth2.getUser(exchangedCode.access_token)
    } catch (err) {
        ctx.redirect(`${process.env.WEBSITE_URL}/authorization?status=failed`)

        return
    }

    try {
        await OAuth2.updateUserRoleConnection(exchangedCode.access_token, {
            platform_name: 'Lacuna',
            metadata: {
                account_created_at: new Date(SnowflakeUtil.timestampFrom(currentUser.id)).toISOString()
            }
        })
    } catch (err) {
        ctx.redirect(`${process.env.WEBSITE_URL}/authorization?status=failed`)

        return
    }

    ctx.redirect(`${process.env.WEBSITE_URL}/authorization`)
}

export default router
