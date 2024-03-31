import { APIUser, PermissionsBitField, RESTAPIPartialCurrentUserGuild, UserFlags } from 'discord.js'
import { Context, Next } from 'koa'
import database from '../../database'
import APIError from './APIError'
import { oauth2 } from './DiscordOAuth2'

export async function authenticate(ctx: Context, next: Next): Promise<void> {
    const accessToken = ctx.request.headers.authorization

    if (!accessToken) {
        ctx.throw(401, new APIError(4001))
    }

    let currentUser: APIUser

    try {
        currentUser = await oauth2.getUser(accessToken)
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

export async function checkPermissions(ctx: Context, next: Next): Promise<void> {
    const accessToken = ctx.request.headers.authorization
    const guildId: string = ctx.params.guild_id
    const currentUser: UserState = ctx.state.user

    let currentUserGuilds: RESTAPIPartialCurrentUserGuild[]

    try {
        currentUserGuilds = await oauth2.getUserGuilds(accessToken)
    } catch (err) {}

    if (!currentUserGuilds) {
        ctx.throw(400, new APIError(5001))
    }

    const guild = currentUserGuilds.find(v => v.id === guildId)
    const { rootUsers } = await database.getInternalData(),
        isRootUser = rootUsers.includes(currentUser.id)

    ctx.state.guild = guild ?? {}

    if (isRootUser) {
        await next()
        return
    }

    if (!guild) {
        ctx.throw(404, new APIError(1002))
    }

    const permissions = new PermissionsBitField(BigInt(guild.permissions)),
        isAdministrator = permissions.has(PermissionsBitField.Flags.Administrator),
        isExpert = await isBotExpert(guildId, currentUser.id)

    if (!guild.owner && !isAdministrator && !isExpert) {
        ctx.throw(403, new APIError(4002))
    }

    await next()
}

export async function isBotExpert(guildId: string, userId: string): Promise<boolean> {
    const server = await database.servers.findOne({ _id: guildId })
    return !!(server && server.bot_experts.includes(userId))
}

export interface UserState {
    id: string
    username: string
    global_name: string
    avatar: string | null
    flags: UserFlags
}
