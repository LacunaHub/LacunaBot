import { PermissionsBitField } from 'discord.js'
import { Context, Next } from 'koa'
import db from '../../../database'
import OAuth2, { OAuth2Guild, OAuth2User } from '../discord/OAuth2'
import { isBotExpert } from './Utils'

const oauth2 = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

export async function authorize(ctx: Context, next: Next) {
    const access_token = ctx.request.headers.authorization

    if (!access_token || access_token === 'null') ctx.throw(401)

    const user = (await oauth2.getUser(access_token).catch(() => {})) as OAuth2User

    if (!user) ctx.throw(403)

    ctx.request.headers['user-id'] = user.id

    await next()
}

export async function checkPermissions(ctx: Context, next: Next) {
    const guild_id = ctx.params.guild_id
    const user_id = ctx.request.headers['user-id'] as string

    if (!guild_id) ctx.throw(400)

    const guilds = (await oauth2.getUserGuilds(ctx.request.headers.authorization).catch(() => {})) as OAuth2Guild[]

    if (!guilds) ctx.throw(403)

    const guild = guilds.find(g => g.id == guild_id)

    const is_root_user = (await db.json.get()).rootUsers.includes(user_id)

    if (is_root_user) {
        ctx.request.headers['partial-guild'] = JSON.stringify(guild ?? {})

        await next()

        return
    }

    if (!guild) ctx.throw(404)

    const permissions = new PermissionsBitField(BigInt(guild.permissions))
    const is_bot_expert = await isBotExpert(guild_id, user_id)

    if (!guild.owner && !permissions.has(PermissionsBitField.Flags.Administrator) && !is_bot_expert) ctx.throw(403)

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
