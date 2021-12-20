import { VoiceState } from 'discord.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna, before: VoiceState, state: VoiceState) => {
    if (!before.channelId && state.channelId) {
        self.emit('voiceConnect', state)
    }

    else if (!state.channelId) {
        self.emit('voiceDisconnect', state, before.channel)
    }

    else if (before.channelId && state.channelId) {
        if (before.channelId != state.channelId) {
            self.emit('voiceMove', before, state)
        }

        if (!before.serverMute && state.serverMute) {
            self.emit('voiceServerMute', state)
        }

        else if (before.serverMute && !state.serverMute) {
            self.emit('voiceServerUnmute', state)
        }

        if (!before.serverDeaf && state.serverDeaf) {
            self.emit('voiceServerDeaf', state)
        }

        else if (before.serverDeaf && !state.serverDeaf) {
            self.emit('voiceServerUndeaf', state)
        }

        if (!before.selfVideo && state.selfVideo) {
            self.emit('voiceStreamStart', state)
        }

        else if (before.selfVideo && !state.selfVideo) {
            self.emit('voiceStreamStop', state)
        }
    }
}

export default {
    name: 'voiceStateUpdate',
    handler
}