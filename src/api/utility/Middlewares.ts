import { Context, Next } from 'koa'
import database from '../../database'
import APIError from './APIError'

export async function findServer(ctx: Context, next: Next) {
    const guildId: string = ctx.params.guildId

    const server = await database.servers.findOne({ _id: guildId })
    if (!server || server.blocked) ctx.throw(404, new APIError(1003))

    ctx.state.server = server
    await next()
}
