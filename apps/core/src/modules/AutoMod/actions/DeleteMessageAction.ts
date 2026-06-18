import Lacuna from '@/internals/Lacuna.js'
import { type SendMessageActionOptions } from './SendMessageAction.js'

export default async function deleteMessageAction(self: Lacuna, options: DeleteMessageActionOptions) {
    const { message } = options

    try {
        await message.delete()
    } catch (err) {
        self.logger.error({ module: 'AutoMod', action: 'DeleteMessage', err, guildId: message.guildId })
    }
}

export interface DeleteMessageActionOptions extends Omit<SendMessageActionOptions, 'config'> {}
