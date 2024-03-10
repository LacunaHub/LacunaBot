import { APIUser, PermissionsBitField, RESTAPIPartialCurrentUserGuild } from 'discord.js'
import { Context, Next } from 'koa'
import db from '../../../database'
import DiscordOAuth2 from '../discord/OAuth2'
import APIError from './APIError'
import { isBotExpert } from './Utils'

const OAuth2 = new DiscordOAuth2(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET)

export async function authorize(ctx: Context, next: Next) {
    const accessToken = ctx.request.headers.authorization

    if (!accessToken) {
        ctx.throw(401, new APIError(4001))
    }

    let currentUser: APIUser

    try {
        currentUser = await OAuth2.getUser(accessToken)
    } catch (err) {}

    if (!currentUser) {
        ctx.throw(403, new APIError(1001))
    }

    ctx.state.user = {
        id: currentUser.id,
        username: currentUser.username,
        global_name: currentUser.global_name,
        avatar: currentUser.avatar,
        flags: currentUser.flags
    }

    await next()
}

export async function checkPermissions(ctx: Context, next: Next) {
    const accessToken = ctx.request.headers.authorization
    const guildId: string = ctx.params.guild_id
    const currentUser: Partial<APIUser> = ctx.state.user

    let currentUserGuilds: RESTAPIPartialCurrentUserGuild[]

    try {
        currentUserGuilds = await OAuth2.getUserGuilds(accessToken)
    } catch (err) {}

    if (!currentUserGuilds) {
        ctx.throw(400, new APIError(5001))
    }

    const guild = currentUserGuilds.find(g => g.id === guildId)
    const isRootUser = (await db.getInternalData()).rootUsers.includes(currentUser.id)

    if (isRootUser) {
        ctx.state.guild = guild ?? {}

        await next()

        return
    }

    if (!guild) {
        ctx.throw(404, new APIError(1002))
    }

    const permissions = new PermissionsBitField(BigInt(guild.permissions)),
        isAdministrator = permissions.has(PermissionsBitField.Flags.Administrator)
    const isExpert = await isBotExpert(guildId, currentUser.id)

    if (!guild.owner && !isAdministrator && !isExpert) {
        ctx.throw(403, new APIError(4002))
    }

    ctx.state.guild = guild

    await next()
}

export async function passKnownReferrers(ctx: Context, next: Next) {
    const referer = ctx.request.headers.referer
    const { allowedAPIReferrers, publicAPIPaths } = await db.getInternalData()

    if (process.env.NODE_ENV === 'development') {
        await next()

        return
    }

    const isAllowedHost = referer && allowedAPIReferrers.some(host => referer.includes(host)),
        isAllowedURL = publicAPIPaths.some(url => ctx.url.startsWith(url))

    if (!isAllowedHost && !isAllowedURL) {
        ctx.throw(503, new APIError())
    }

    await next()
}
