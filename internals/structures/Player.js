const { Manager } = require('@lavacord/discord.js')
const { Collection } = require('discord.js')
const { URLSearchParams } = require('url')
const schedule = require('node-schedule')
const request = require('node-fetch')
const QueueManager = require('./QueueManager')

class Player {
    /**
     * @param {import('../Lacuna')} self
     * @param {import('@lavacord/discord.js').ManagerOptions} options 
     */
    constructor(self, options) {
        this.self = self

        this.nodes = [
            { id: 'Winter', host: process.env.WINTER_HOST, port: Number(process.env.WINTER_PORT), password: process.env.WINTER_PASSWORD, reconnectInterval: 180000 }
        ]

        this.options = options

        this.queues = new QueueManager()

        this.manager = new Manager(this.self, this.nodes, {
            user: this.options.user,
            shards: this.options.shards
        })

        /**
         * @type {Collection<string, import('node-schedule').Job>}
         */
        this.waiters = new Collection()

        this.connect()
    }

    /**
     * Получает информацию и статистику о музыкальных плеерах
     */
    get stats() {
        const nodes = [ ...this.manager.nodes.values() ]

        return nodes.map(node => {
            return {
                id: node.id,
                connected: node.connected,
                cpu_usage: {
                    player: Number(node.stats.cpu.lavalinkLoad.toFixed(2)),
                    system: Number((node.stats.cpu.systemLoad / node.stats.cpu.cores * 100).toFixed(2))
                },
                memory_usage: Number(((node.stats.memory.used * 100) / node.stats.memory.reservable).toFixed(2)),
                uptime: node.stats.uptime,
                players: {
                    playing: node.stats.playingPlayers,
                    total: node.stats.players
                }
            }
        })
    }

    /**
     * Возвращает оптимальный музыкальный плеер для воспроизведения треков
     */
    get optimalNode() {
        const nodes = this.manager.idealNodes

        return nodes.sort((a, b) => {
            return (a.stats.cpu ? a.stats.cpu.systemLoad / a.stats.cpu.cores * 100 : 0) - (b.stats.cpu ? b.stats.cpu.systemLoad / b.stats.cpu.cores * 100 : 0)
        })[0]
    }

    /**
     * Выполняет подключение ко всем музыкальным плеерам
     */
    async connect() {
        const connection = await this.manager.connect()

        await this.self.emit('playerManagerConnect', this.manager.nodes.size)

        this.manager.on('ready', (node) => this.self.emit('playerNodeReady', node))
        this.manager.on('disconnect', (event, node) => this.self.emit('playerNodeDisconnect', event, node))
        this.manager.on('reconnecting', (node) => this.self.emit('playerNodeReconnecting', node))
        this.manager.on('error', (err, node) => this.self.emit('playerNodeError', err, node))

        return connection
    }

    /**
     * Возвращает плеер и очередь воспроизведения
     * 
     * @param {String} id
     */
    get(id) {
        const player = this.manager.players.get(id)
        const queue = this.queues.cache.get(id)

        return player && queue ? { player: player, queue: queue } : null
    }

    /**
     * Выполняет поиск по указанным параметрам
     * 
     * @param {String} params
     * @returns {import('@lavacord/discord.js').TrackResponse}
     */
    async search(params) {
        const node = this.optimalNode

        const url = new RegExp(`^https?:\/\/`).test(params)
        const search = url ? params : `ytsearch:${params}`

        const query = new URLSearchParams()
        query.append('identifier', search)

        const result = await request(`http://${node.host}:${node.port}/loadtracks?${query}`, {
            method: "GET",
            headers: {
                Authorization: node.password
            }
        })

        return result.json()
    }

    /**
     * Останавливает воспроизведение на 30 минут, когда в голосовом канале никого нет,
     * после чего закрывает соединение или возобновляет его, когда кто-то присоединяется к соединению
     * 
     * @param {String} id
     * @param {Boolean} state
     */
    async wait(id, state) {
        const player = this.manager.players.get(id)

        if (player) {
            if (state) {
                if (!player.paused) await player.pause(state)

                const job = schedule.scheduleJob(id, new Date(Date.now() + 1800000), () => this.destroy(id))
                await this.waiters.set(id, job)
            }

            else {
                if (player.paused) await player.pause(state)

                const job = this.waiters.get(id)

                if (job) {
                    await job.cancel()
                    await this.waiters.delete(id)
                }
            }

            return true
        }

        return false
    }

    /**
     * Закрывает воспроизведение
     * 
     * @param {String} id
     */
    async destroy(id) {
        await this.manager.leave(id)
        await this.queues.cache.delete(id)

        return this
    }
}

module.exports = Player