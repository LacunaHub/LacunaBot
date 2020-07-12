const { Manager } = require('@lavacord/discord.js')
const { Collection } = require('discord.js')
const request = require('node-superfetch')
const { URLSearchParams } = require('url')
const schedule = require('node-schedule')

class Player {
    /**
     * @param {import('../Rexana')} self
     * @param {import('@lavacord/discord.js').ManagerOptions} options 
     */
    constructor(self, options) {
        this.self = self

        this.nodes = [
            { id: 'Luana', host: process.env.MUSICNODE1_HOST, port: Number(process.env.MUSICNODE1_PORT), password: process.env.MUSICNODE1_PASSWORD, reconnectInterval: 180000 }
        ]

        this.options = options

        /**
         * @type {Collection<String, import('../typedef').PlayerQueue>}
         */
        this.queues = new Collection()

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
        }).sort((a, b) => {
            const months = ['Luana']

            return months.indexOf(a.id) - months.indexOf(b.id)
        })
    }

    get optimalNode() {
        const nodes = this.manager.idealNodes

        return nodes.sort((a, b) => {
            return (a.stats.cpu ? a.stats.cpu.systemLoad / a.stats.cpu.cores * 100 : 0) - (b.stats.cpu ? b.stats.cpu.systemLoad / b.stats.cpu.cores * 100 : 0)
        })[0]
    }

    async connect() {
        this.manager.on('error', (err, node) => {
            this.self.logger.error(`(Player#${node.id}):`, err)
        })

        return await this.manager.connect()
    }

    /**
     * @param {String} params
     * @returns {import('@lavacord/discord.js').TrackResponse}
     */
    async search(params) {
        const node = this.optimalNode

        const url = new RegExp(`^https?:\/\/`).test(params)
        const search = url ? params : `ytsearch:${params}`

        const query = new URLSearchParams()
        query.append('identifier', search)

        const result = await request.get(`http://${node.host}:${node.port}/loadtracks?${query}`, {
            headers: {
                Authorization: node.password
            }
        })

        return result.body
    }

    /**
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
     * @param {String} id
     */
    async destroy(id) {
        await this.manager.leave(id)
        await this.queues.delete(id)

        return this
    }
}

module.exports = Player