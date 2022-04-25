import Guilds from './Guilds'
import { createInteractiveMessage, deleteInteractiveMessage, updateInteractiveMessage } from './InteractiveMessages'

export default {
    guilds: Guilds,
    im: {
        createInteractiveMessage,
        updateInteractiveMessage,
        deleteInteractiveMessage
    }
}
