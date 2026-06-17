import APIError from '@/api/utility/APIError.js'
import database from '@/database/index.js'
import { type ServerDocument, type ServerModulesInteractiveReaction } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function updateInteractiveReaction(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const irId: string = ctx.params.irId,
        data: ServerModulesInteractiveReaction = ctx.request.body

    const interactiveReaction = server.modules.reactions.find(v => v.id === irId)
    if (!interactiveReaction) ctx.throw(404, new APIError(1013))

    if (
        server.modules.reactions.some(
            v =>
                v.id !== data.id &&
                v.message.id === data.message.id &&
                (v.element.single || v.element.global_single) &&
                v.references.some(ref => data.references.includes(ref))
        )
    )
        ctx.throw(400, new APIError(4008))

    await database.servers.updateOne(
        { _id: server._id, 'modules.reactions.id': interactiveReaction.id },
        {
            $set: {
                'modules.reactions.$.element.single': data.element.single,
                'modules.reactions.$.element.reverse': data.element.reverse,
                'modules.reactions.$.references': data.references
            }
        }
    )

    ctx.status = 200
    ctx.body = data
}
