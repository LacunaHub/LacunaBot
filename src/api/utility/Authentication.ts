import { APIGuildMember, APIUser, PermissionsBitField, RESTAPIPartialCurrentUserGuild, UserFlags } from 'discord.js'
import { Context, Next } from 'koa'
import database from '../../database'
import APIError from './APIError'
import { oauth2 } from './DiscordOAuth2'
import DiscordUtils from './DiscordUtils'

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
    const guildId: string = ctx.params.guildId
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

    if (isRootUser) return await next()

    if (!guild) {
        ctx.throw(404, new APIError(1002))
    }

    const permissions = new PermissionsBitField(BigInt(guild.permissions)),
        isAdministrator = permissions.has(PermissionsBitField.Flags.Administrator)

    if (guild.owner || isAdministrator) return await next()

    const isExpert = await isBotExpert(guildId, currentUser.id)
    if (isExpert) return await next()

    ctx.throw(403, new APIError(4002))
}

export async function isBotExpert(guildId: string, userId: string): Promise<boolean> {
    const server = await database.servers.findOne({ _id: guildId })
    if (!server) return false

    if (server.bot_experts.includes(userId)) {
        return true
    } else {
        let member: APIGuildMember

        try {
            member = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildMember(guildId, userId))) as any
        } catch (err) {}

        if (member && member.roles.some(v => server.bot_experts.includes(v))) return true
    }

    return false
}

export async function identify(ctx: Context, next: Next) {
    const accessToken = ctx.request.headers.authorization
    if (!accessToken) return await next()

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

export async function isGuildMember(guildId: string, userId: string) {
    let member: APIGuildMember

    try {
        member = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildMember(guildId, userId))) as any
    } catch (err) {}

    return !!member
}

export interface UserState {
    id: string
    username: string
    global_name: string
    avatar: string | null
    flags: UserFlags
}
