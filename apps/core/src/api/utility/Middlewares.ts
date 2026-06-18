import database from '@/database/index.js'
import { type Context, type Next } from 'koa'
import APIError from './APIError.js'

export async function findServer(ctx: Context, next: Next) {
    const guildId: string = ctx.params.guildId

    const server = await database.servers.findOne({ _id: guildId })
    if (!server || server.blocked) ctx.throw(404, new APIError(1003))

    ctx.state.server = server
    await next()
}
