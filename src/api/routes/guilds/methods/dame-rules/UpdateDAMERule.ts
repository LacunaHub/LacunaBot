import { ServerDocument, ServerModerationDAMERule, ServerModerationDAMERuleActionType } from '@/database/schemas/Servers'
import { APIAutoModerationActionMetadata, APIAutoModerationRule } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../../database'
import APIError from '../../../../utility/APIError'
import DiscordUtils from '../../../../utility/DiscordUtils'

export default async function updateDAMERule(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    const ruleId: string = ctx.params.ruleId
    let data: ServerModerationDAMERule = ctx.request.body

    const dameRule = server.moderation.dame_rules.find(v => v.id === ruleId)
    if (!dameRule) ctx.throw(404, new APIError(1015))

    if (JSON.stringify(data) !== JSON.stringify(dameRule)) {
        let apiAutoModRule: APIAutoModerationRule
        try {
            apiAutoModRule = (await DiscordUtils.rest.patch(DiscordUtils.restRoutes.guildAutoModerationRule(server._id, dameRule.id), {
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
            ctx.log.error({
                module: 'DAMERules',
                action: 'Update',
                err,
                guildId: server._id
            })

            ctx.throw(500, new APIError(5023, err.toString()))
        }

        data = {
            id: apiAutoModRule.id,
            name: apiAutoModRule.name,
            event_type: apiAutoModRule.event_type,
            trigger_type: apiAutoModRule.trigger_type,
            trigger_metadata: apiAutoModRule.trigger_metadata,
            actions: [...apiAutoModRule.actions, ...data.actions.filter(v => v.type > 100)],
            enabled: apiAutoModRule.enabled,
            exempt_roles: apiAutoModRule.exempt_roles,
            exempt_channels: apiAutoModRule.exempt_channels
        } as any

        await database.servers.updateOne(
            { _id: server._id, 'moderation.dame_rules.id': ruleId },
            {
                $set: {
                    'moderation.dame_rules.$.name': data.name,
                    'moderation.dame_rules.$.event_type': data.event_type,
                    'moderation.dame_rules.$.trigger_type': data.trigger_type,
                    'moderation.dame_rules.$.trigger_metadata': data.trigger_metadata,
                    'moderation.dame_rules.$.actions': data.actions,
                    'moderation.dame_rules.$.enabled': data.enabled,
                    'moderation.dame_rules.$.exempt_roles': data.exempt_roles,
                    'moderation.dame_rules.$.exempt_channels': data.exempt_channels
                }
            }
        )
    }

    ctx.status = 200
    ctx.body = data
}
