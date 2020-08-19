class VoiceManager {
    /**
     * Создаёт временный голосовой канал
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('discord.js').VoiceState} state
     */
    static async CreateTempVoice(self, state) {

    }

    /**
     * Создаёт временный голосовой канал или перемещает в него, если он уже создан
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('discord.js').VoiceState} before
     * @param {import('discord.js').VoiceState} state
     */
    static async CreateTempVoiceOnMove(self, before, state) {

    }

    /**
     * Удаляет временный голосовой канал
     * 
     * @param {import('../internals/Lacuna')} self
     * @param {import('discord.js').VoiceState} state
     * @param {import('discord.js').VoiceChannel} channel
     */
    static async DeleteTempVoice(self, state, channel) {
        
    }
}

module.exports = VoiceManager