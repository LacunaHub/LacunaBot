import APIError from '@/api/utility/APIError.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function deleteAutoVoice(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const avId: string = ctx.params.avId

    const autoVoice = server.modules.voice_manager.autovoices.find(v => v.channel_id === avId)
    if (!autoVoice) ctx.throw(404, new APIError(1017))

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.voice_manager.autovoices': {
                    channel_id: autoVoice.channel_id
                }
            }
        }
    )

    ctx.status = 204
}
