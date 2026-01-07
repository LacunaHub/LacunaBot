import { ServerDocument, ServerModerationDAMERule, ServerModerationDAMERuleActionType } from '@/database/schemas/Servers'
import { APIAutoModerationActionMetadata, APIAutoModerationRule } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../../database'
import Logger from '../../../../../internals/Logger'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

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
                        if (v.type === ServerModerationDAMERuleActionType.BlockMessage) metadata.custom_message = v.metadata.custom_message
                        if (v.type === ServerModerationDAMERuleActionType.SendAlertMessage) metadata.channel_id = v.metadata.channel_id
                        if (v.type === ServerModerationDAMERuleActionType.Timeout) metadata.duration_seconds = v.metadata.duration_seconds

                        return {
                            type: v.type,
                            metadata
                        }
                    })
            }
        })) as any
    } catch (err) {
        await Logger.handleError({
            module: 'DAMERules',
            action: 'Create',
            error: err,
            guild_id: server._id
        })

        ctx.throw(500, new APIError(5022, err.toString()))
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
