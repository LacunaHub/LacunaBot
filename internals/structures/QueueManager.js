const { Collection } = require('discord.js')
const { ShuffleArray } = require('../utility/Utils')

class QueueManager {
    constructor() {
        /**
         * @type {Collection<String, import('../Typings').PlayerQueue>}
         */
        this.cache = new Collection()
    }

    /**
     * Текущая громкость воспроизведения
     * 
     * @param {String} guild_id
     */
    currentVolume(guild_id) {
        const cache = this.cache.get(guild_id)

        return cache ? cache.volume : 0
    }

    /**
     * Получает кэш очереди или создаёт новый
     * 
     * @param {String} guild_id
     * @param {import('../Typings').PlayerQueue} data
     */
    fetch(guild_id, data) {
        const cache = this.cache.get(guild_id)

        if (!cache) return this.cache.set(guild_id, data).get(guild_id)
        return cache
    }

    /**
     * Перемешивает очередь воспроизведения
     * 
     * @param {String} guild_id
     */
    shuffle(guild_id) {
        const cache = this.cache.get(guild_id)

        if (cache) cache.tracks = ShuffleArray(cache.tracks)

        return cache
    }

    /**
     * Устанавливает громкость для воспроизведения
     * 
     * @param {String} guild_id
     * @param {Number} volume
     */
    volume(guild_id, volume) {
        const cache = this.cache.get(guild_id)

        if (!cache) throw new Error('Queue cache of guild not found')

        cache.volume = volume
        return cache
    }

    /**
     * Добавляет голос для пропуска трека
     * 
     * @param {String} guild_id
     */
    voteForSkip(guild_id) {
        const cache = this.cache.get(guild_id)

        if (!cache) throw new Error('Queue cache of guild not found')

        cache.skip_votes++
        return cache
    }

    /**
     * Сбрасывает голоса для пропуска трека
     * 
     * @param {String} guild_id
     */
    resetSkipVotes(guild_id) {
        const cache = this.cache.get(guild_id)

        if (!cache) throw new Error('Queue cache of guild not found')

        cache.skip_votes = 0
        return cache
    }

    /**
     * Устанавливает исполнителя воспроизведения
     * 
     * @param {String} guild_id
     * @param {String} user_id
     */
    setPlaybackExecutor(guild_id, user_id) {
        const cache = this.cache.get(guild_id)

        if (!cache) throw new Error('Queue cache of guild not found')

        cache.executor = user_id
        return cache
    }
}

module.exports = QueueManager