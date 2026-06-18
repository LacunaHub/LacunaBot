import APIError from '@/api/utility/APIError.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import {
    type ServerDocument,
    type ServerModerationDAMERule,
    ServerModerationDAMERuleActionType
} from '@/database/schemas/Servers.js'
import { type APIAutoModerationActionMetadata, type APIAutoModerationRule } from 'discord.js'
import { type Context } from 'koa'

export default async function createDAMERule(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const data: ServerModerationDAMERule = ctx.request.body

    let apiAutoModRule: APIAutoModerationRule
    try {
        apiAutoModRule = (await DiscordUtils.rest.post(DiscordUtils.restRoutes.guildAutoModerationRules(server._id), {
            body: {
                ...data,
                actions: data.actions
                    .filter(v => v.type < 101)
                    .map(v => {
                        const metadata: APIAutoModerationActionMetadata = {}
                        if (v.type === ServerModerationDAMERuleActionType.BlockMessage)
                            metadata.custom_message = v.metadata.custom_message!
                        if (v.type === ServerModerationDAMERuleActionType.SendAlertMessage)
                            metadata.channel_id = v.metadata.channel_id!
                        if (v.type === ServerModerationDAMERuleActionType.Timeout)
                            metadata.duration_seconds = v.metadata.duration_seconds!

                        return {
                            type: v.type,
                            metadata
                        }
                    })
            }
        })) as any
    } catch (err) {
        ctx.log.error({
            module: 'DAMERules',
            action: 'Create',
            err,
            guildId: server._id
        })

        ctx.throw(500, new APIError(5022, (err as any).toString()))
    }

    const dameRule = {
        id: apiAutoModRule.id,
        name: apiAutoModRule.name,
        event_type: apiAutoModRule.event_type,
        trigger_type: apiAutoModRule.trigger_type,
        trigger_metadata: apiAutoModRule,
        actions: [...apiAutoModRule.actions, ...data.actions.filter(v => v.type > 100)],
        enabled: apiAutoModRule.enabled,
        exempt_roles: apiAutoModRule.exempt_roles,
        exempt_channels: apiAutoModRule.exempt_channels
    }

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'moderation.dame_rules': dameRule
            }
        }
    )

    ctx.status = 200
    ctx.body = dameRule
}
