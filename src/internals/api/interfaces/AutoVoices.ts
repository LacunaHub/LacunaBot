import database from '../../../database'
import { IAutoVoice, ServerDocument } from '../../../database/schemas/Servers'
import APIError from '../utility/APIError'

export async function createAutoVoice(server: ServerDocument, data: IAutoVoice) {
    const autoVoices = server.modules.voice_manager.autovoices

    if (autoVoices.length >= 2 && !server.server.premium.available) throw new APIError(3013)
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

export async function updateAutoVoice(server: ServerDocument, data: Partial<IAutoVoice>) {
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
