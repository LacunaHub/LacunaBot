import database from '../../../database'
import { IAutoVoice, ServerDocument } from '../../../database/schemas/Servers'

export async function createAutoVoice(server: ServerDocument, data: IAutoVoice) {
    const autovoices = server.modules.voice_manager.autovoices

    if (autovoices.length >= 2 && !server.server.premium.available) throw new Error('LIMIT_REACHED_NO_PREMIUM')
    if (autovoices.length >= 20) throw new Error('LIMIT_REACHED')
    if (autovoices.some(i => i.channel_id == data.channel_id)) throw new Error('ALREADY_EXISTS')

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
    const autovoices = server.modules.voice_manager.autovoices

    if (!autovoices.some(i => i.channel_id == data.channel_id)) throw new Error('NOT_FOUND')

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
    const autovoices = server.modules.voice_manager.autovoices
    const autovoice = autovoices.find(i => i.channel_id == data.channel_id)

    if (!autovoice) throw new Error('NOT_FOUND')

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
