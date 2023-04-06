import { APIUser, PermissionsBitField, RESTAPIPartialCurrentUserGuild } from 'discord.js'
import { Context, Next } from 'koa'
import db from '../../../database'
import DiscordOAuth2 from '../discord/OAuth2'
import { isBotExpert } from './Utils'

const OAuth2 = new DiscordOAuth2(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET)

export async function authorize(ctx: Context, next: Next) {
    const accessToken = ctx.request.headers.authorization

    if (!accessToken || accessToken === 'null') ctx.throw(401)

    let currentUser: APIUser

    try {
        currentUser = await OAuth2.getUser(accessToken)
    } catch (err) {}

    if (!currentUser) ctx.throw(403)

    ctx.request.headers['user-id'] = currentUser.id

    await next()
}

export async function checkPermissions(ctx: Context, next: Next) {
    const guild_id = ctx.params.guild_id
    const user_id = ctx.request.headers['user-id'] as string

    if (!guild_id) ctx.throw(400)

    let currentUserGuilds: RESTAPIPartialCurrentUserGuild[]

    try {
        currentUserGuilds = await OAuth2.getUserGuilds(ctx.request.headers.authorization)
    } catch (err) {}

    if (!currentUserGuilds) ctx.throw(403)

    const guild = currentUserGuilds.find(g => g.id === guild_id)
    const isRootUser = (await db.json.get()).rootUsers.includes(user_id)

    if (isRootUser) {
        ctx.request.headers['partial-guild'] = JSON.stringify(guild ?? {})

        await next()

        return
    }

    if (!guild) ctx.throw(404)

    const permissions = new PermissionsBitField(BigInt(guild.permissions))
    const isExpert = await isBotExpert(guild_id, user_id)

    if (!guild.owner && !permissions.has(PermissionsBitField.Flags.Administrator) && !isExpert) ctx.throw(403)

    ctx.request.headers['partial-guild'] = JSON.stringify(guild)

    await next()
}

export async function passKnownReferrers(ctx: Context, next: Next) {
    const referer = ctx.request.headers.referer
    const { allowedApiHosts: hosts, allowedApiUrls: urls } = await db.json.get()

    if (process.env.NODE_ENV === 'development') {
        await next()

        return
    }

    const passReferrers = referer && hosts.some(host => referer.includes(host))
    const passUrls = urls.some(url => ctx.url.startsWith(url))

    if (!passReferrers && !passUrls) ctx.throw(503)

    await next()
}
