import APIError from '@/api/utility/APIError.js'
import database from '@/database/index.js'
import { type ServerDocument, type ServerModulesVoiceManagerAutoVoice } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function createAutoVoice(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const data: ServerModulesVoiceManagerAutoVoice = ctx.request.body

    if (server.modules.voice_manager.autovoices.length >= 20) ctx.throw(406, new APIError(3014))
    if (server.modules.voice_manager.autovoices.some(v => v.channel_id === data.channel_id))
        ctx.throw(409, new APIError(2008))

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.voice_manager.autovoices': data
            }
        }
    )

    ctx.status = 200
    ctx.body = data
}
