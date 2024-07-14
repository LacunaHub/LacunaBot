import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'

export default async function getLogs(ctx: Context) {
    const guildId: string = ctx.params.guildId,
        server: ServerDocument = ctx.state.server

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
