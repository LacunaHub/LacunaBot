import { createAutoVoice, deleteAutoVoice, updateAutoVoice } from './AutoVoices'
import { updateSettings } from './Commons'
import { createCustomCommand, deleteCustomCommand, updateCustomCommand } from './CustomCommands'
import { createInteractiveMessage, deleteInteractiveMessage, updateInteractiveMessage } from './InteractiveMessages'
import { createInteractiveReaction, deleteInteractiveReaction, updateInteractiveReaction } from './InteractiveReactions'
import { createTelegramSubscription, deleteTelegramSubscription, updateTelegramSubscription } from './TelegramSubscriptions'
import { createTwitchSubscription, deleteTwitchSubscription, updateTwitchSubscription } from './TwitchSubscriptions'
import { createYouTubeSubscription, deleteYouTubeSubscription, updateYouTubeSubscription } from './YouTubeSubscriptions'

export default {
    updateSettings,
    createAutoVoice,
    updateAutoVoice,
    deleteAutoVoice,
    createCustomCommand,
    updateCustomCommand,
    deleteCustomCommand,
    createInteractiveMessage,
    updateInteractiveMessage,
    deleteInteractiveMessage,
    createInteractiveReaction,
    updateInteractiveReaction,
    deleteInteractiveReaction,
    createTelegramSubscription,
    deleteTelegramSubscription,
    updateTelegramSubscription,
    createTwitchSubscription,
    updateTwitchSubscription,
    deleteTwitchSubscription,
    createYouTubeSubscription,
    updateYouTubeSubscription,
    deleteYouTubeSubscription
}
