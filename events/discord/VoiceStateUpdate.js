/**
 * @param {import('../../internals/Lacuna')} self
 * @param {import('discord.js').VoiceState} before
 * @param {import('discord.js').VoiceState} state
 */
const handler = async (self, before, state) => {
    if (!before.channelId && state.channelId) {
        await self.emit('voiceConnect', state)
    }

    else if (!state.channelId) {
        await self.emit('voiceDisconnect', state, before.channel)
    }

    else if (before.channelId && state.channelId) {
        if (before.channelId != state.channelId) {
            await self.emit('voiceMove', before, state)
        }

        if (!before.serverMute && state.serverMute) {
            await self.emit('voiceServerMute', state)
        }

        else if (before.serverMute && !state.serverMute) {
            await self.emit('voiceServerUnmute', state)
        }

        if (!before.serverDeaf && state.serverDeaf) {
            await self.emit('voiceServerDeaf', state)
        }

        else if (before.serverDeaf && !state.serverDeaf) {
            await self.emit('voiceServerUndeaf', state)
        }

        if (!before.selfVideo && state.selfVideo) {
            await self.emit('voiceStreamStart', state)
        }

        else if (before.selfVideo && !state.selfVideo) {
            await self.emit('voiceStreamStop', state)
        }
    }
}

module.exports = {
    name: 'voiceStateUpdate',
    handler
}