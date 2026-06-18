import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { type ServerDocument } from '@/database/schemas/Servers.js'
import { type Context } from 'koa'

export default async function deleteDAMERule(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const ruleId: string = ctx.params.ruleId

    const dameRule = server.moderation.dame_rules.find(v => v.id === ruleId)
    if (!dameRule) ctx.throw(404, new APIError(1015))

    try {
        await DiscordUtils.rest.delete(DiscordUtils.restRoutes.guildAutoModerationRule(server._id, ruleId))
    } catch (err) {
        ctx.log.error({
            module: 'DAMERules',
            action: 'Delete',
            err,
            guildId: server._id
        })

        ctx.throw(500, new APIError(5024, (err as any).toString()))
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'moderation.dame_rules': {
                    id: ruleId
                }
            }
        }
    )

    ctx.status = 204
}
