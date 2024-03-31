import { Context } from 'koa'
import database from '../../../../database'
import APIError from '../../../utility/APIError'

export default async function downloadLogs(ctx: Context) {
    const guildId = ctx.params.guild_id,
        server = await database.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    const fileName = `${guildId}-${new Date().toISOString()}.log`
    const fileData = server.logs
        .map(i => `[${i.level}: ${new Date(i.timestamp).toISOString()}] - [${i.module}${i.action ?? ''}] ${i.message}`)
        .join('\n')

    ctx.status = 200
    ctx.body = {
        file_name: fileName,
        data: fileData
    }
}
