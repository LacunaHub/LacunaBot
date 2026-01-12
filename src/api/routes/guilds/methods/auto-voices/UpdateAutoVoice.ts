import { ServerDocument, ServerModulesVoiceManagerAutoVoice } from '@/database/schemas/Servers'
import { Context } from 'koa'
import database from '../../../../../database'
import APIError from '../../../../utility/APIError'

export default async function updateAutoVoice(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const avId: string = ctx.params.avId,
        data: ServerModulesVoiceManagerAutoVoice = ctx.request.body

    const autoVoice = server.modules.voice_manager.autovoices.find(v => v.channel_id === avId)
    if (!autoVoice) ctx.throw(404, new APIError(1017))

    await database.servers.updateOne(
        { _id: server._id, 'modules.voice_manager.autovoices.channel_id': data.channel_id },
        {
            $set: {
                'modules.voice_manager.autovoices.$.default': data.default,
                'modules.voice_manager.autovoices.$.allowed_roles': data.allowed_roles ?? [],
                'modules.voice_manager.autovoices.$.blocked_roles': data.blocked_roles ?? [],
                'modules.voice_manager.autovoices.$.moderator_roles': data.moderator_roles ?? []
            }
        }
    )

    ctx.status = 200
    ctx.body = data
}
