import { ServerDocument } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function deleteDAMERule(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const ruleId: string = ctx.params.ruleId

    const dameRule = server.moderation.dame_rules.find(v => v.id === ruleId)
    if (!dameRule) ctx.throw(404, new APIError(1015))

    try {
        await DiscordUtils.rest.delete(DiscordUtils.restRoutes.guildAutoModerationRule(server._id, ruleId))
    } catch (err) {
        await Logger.handleError({
            module: 'DAMERules',
            action: 'Delete',
            error: err,
            guild_id: server._id
        })

        ctx.throw(500, new APIError(5024, err.toString()))
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
