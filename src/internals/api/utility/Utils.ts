import { APIGuildMember } from 'discord.js'
import rateLimit from 'koa-ratelimit'
import database from '../../../database'
import DiscordUtils from '../../utility/DiscordUtils'

export async function isBotExpert(guild_id: string, user_id: string): Promise<boolean> {
    const server = await database.servers.findOne({ _id: guild_id })
    let member: APIGuildMember

    try {
        member = (await DiscordUtils.restApi.get(DiscordUtils.apiRoutes.guildMember(guild_id, user_id))) as any
    } catch (err) {}

    return server && member ? member.roles.some(r => server.server.bot_expert_roles.includes(r)) : false
}

export function createRateLimitMiddleware(max: number, duration: number = 60000) {
    return rateLimit({
        driver: 'memory',
        db: new Map(),
        duration,
        max,
        errorMessage: 'Too Many Requests',
        id: ctx => (ctx.request.headers['x-forwarded-for'] as string) || ctx.ip
    })
}
