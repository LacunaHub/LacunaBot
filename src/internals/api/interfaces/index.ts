import { createAutoVoice, deleteAutoVoice, updateAutoVoice } from './AutoVoices'
import { updateSettings } from './Commons'
import { createCustomCommand, deleteCustomCommand, updateCustomCommand } from './CustomCommands'
import { createInteractiveMessage, deleteInteractiveMessage, updateInteractiveMessage } from './InteractiveMessages'
import { createInteractiveReaction, deleteInteractiveReaction, updateInteractiveReaction } from './InteractiveReactions'
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
    createTwitchSubscription,
    updateTwitchSubscription,
    deleteTwitchSubscription,
    createYouTubeSubscription,
    updateYouTubeSubscription,
    deleteYouTubeSubscription
}
