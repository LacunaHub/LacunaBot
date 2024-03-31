import { ServerDocument, ServerModulesVoiceManagerAutoVoice } from '@lacunahub/lacuna-database-driver'
import { Context } from 'koa'
import database from '../../../../database'
import APIError from '../../../utility/APIError'

export default async function updateAutoVoice(ctx: Context) {
    const guildId: string = ctx.params.guild_id,
        method: string = ctx.params.method
    const data = ctx.request.body

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    let response: any

    try {
        switch (method) {
            case 'create':
                response = await createAutoVoice(server, data)
                break

            case 'update':
                response = await setAutoVoice(server, data)
                break

            case 'delete':
                response = await deleteAutoVoice(server, data)
                break

            default:
                throw new APIError(4018)
        }
    } catch (err) {
        ctx.throw(400, { code: err.code, message: err.message })
    }

    ctx.status = 200
    ctx.body = response
}

export async function createAutoVoice(server: ServerDocument, data: ServerModulesVoiceManagerAutoVoice) {
    const autoVoices = server.modules.voice_manager.autovoices

    if (autoVoices.length >= 2 && !server.premium.available) throw new APIError(3013)
    if (autoVoices.length >= 20) throw new APIError(3014)
    if (autoVoices.some(i => i.channel_id === data.channel_id)) throw new APIError(2008)

    await database.servers.updateOne(
        { _id: server._id },
        {
            $push: {
                'modules.voice_manager.autovoices': data
            }
        }
    )

    return data
}

export async function setAutoVoice(server: ServerDocument, data: Partial<ServerModulesVoiceManagerAutoVoice>) {
    const autoVoices = server.modules.voice_manager.autovoices

    if (!autoVoices.some(i => i.channel_id === data.channel_id)) throw new APIError(1017)

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

    return data
}

export async function deleteAutoVoice(server: ServerDocument, data: { channel_id: string }) {
    const autoVoice = server.modules.voice_manager.autovoices.find(i => i.channel_id === data.channel_id)

    if (!autoVoice) throw new APIError(1017)

    await database.servers.updateOne(
        { _id: server._id },
        {
            $pull: {
                'modules.voice_manager.autovoices': {
                    channel_id: data.channel_id
                }
            }
        }
    )

    return data
}
