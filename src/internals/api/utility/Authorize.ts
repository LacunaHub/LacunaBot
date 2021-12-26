import { Permissions } from 'discord.js'
import OAuth2, { OAuth2Guild, OAuth2User } from '../discord/OAuth2'
import { sharding } from '../../../index'
import { isBotExpert } from '../interfaces/Guilds'
import { Context, Next } from 'koa'
import db from '../../../database'

const oauth2 = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

export async function authorize(ctx: Context, next: Next) {
    const access_token = ctx.request.headers.authorization

    if (!access_token || access_token === 'null') {
        ctx.status = 401; ctx.body = 'Unauthorized'

        return
    }

    const user = await oauth2.getUser(access_token).catch(() => {}) as OAuth2User
    
    if (!user) {
        ctx.status = 403; ctx.body = 'Forbidden'

        return
    }

    ctx.request.headers['user-id'] = user.id

    await next()
}

export async function checkPermissions(ctx: Context, next: Next) {
    const guild_id = ctx.params.guild_id
    const user_id = ctx.request.headers['user-id'] as string

    if (!guild_id) {
        ctx.status = 400; ctx.body = 'Bad Request'

        return
    }

    const guilds = await oauth2.getUserGuilds(ctx.request.headers.authorization).catch(() => {}) as OAuth2Guild[]
    
    if (!guilds) {
        ctx.status = 403; ctx.body = 'Forbidden'

        return
    }

    const guild = guilds.find(g => g.id == guild_id)

    const is_root_user = (await db.json.get()).rootUsers.includes(user_id)

    if (is_root_user) {
        ctx.request.headers['partial-guild'] = JSON.stringify(guild ?? {})

        await next()

        return
    }

    if (!guild) {
        ctx.status = 404; ctx.body = 'Not Found'

        return
    }

    const permissions = new Permissions(BigInt(guild.permissions))
    const is_bot_expert = await isBotExpert(guild_id, user_id)

    if (!guild.owner && !permissions.has('ADMINISTRATOR') && !is_bot_expert) {
        ctx.status = 403; ctx.body = 'Forbidden'

        return
    }

    ctx.request.headers['partial-guild'] = JSON.stringify(guild)

    await next()
}

export async function passKnownReferrers(ctx: Context, next: Next) {
    const referer = ctx.request.headers.referer
    const { allowedApiHosts: hosts } = await db.json.get()

    if (ctx.hostname == 'localhost') {
        await next()

        return
    }

    if (!referer || !hosts.some(host => referer.includes(host))) {
        ctx.status = 503; ctx.body = 'Service Unavailable'

        return
    }

    await next()
}