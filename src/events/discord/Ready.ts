import { Events } from 'discord.js'
import { LavalunaManager } from 'lavaluna.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna) => {
    const [name, hostname, port, password] = process.env.WINTER_MUSIC_NODE.split(':')

    self.lava = new LavalunaManager({
        nodes: [
            {
                name,
                hostname,
                port: Number(port),
                password,
                reconnectRetryAmount: 100,
                reconnectRetryDelay: 60000
            }
        ],
        clientId: self.user.id,
        clientName: `${self.user.username}#${self.cluster.id}`,
        send(id, payload) {
            const guild = self.guilds.cache.get(id)
            guild && guild.shard.send(payload)
        }
    })
        .on('nodeConnect', node => self.emit('nodeConnect', node))
        .on('nodeDisconnect', (node, reason) => self.emit('nodeDisconnect', node, reason))
        .on('nodeError', (node, error) => self.emit('nodeError', node, error))
        .on('nodeReconnect', node => self.emit('nodeReconnect', node))
        .on('playerDestroy', player => self.emit('playerDestroy', player))
        .on('playerQueueEnd', player => self.emit('queueEnd', player))
        .on('playerTrackEnd', player => self.emit('trackEnd', player))
        .on('playerTrackStart', player => self.emit('trackStart', player))

    self.loadEvents()
    self.lava.initialize()

    self.logger.info(`[DiscordReady] ${self.user.username} is ready`)
    await self.logger.telegram.info(`\`[DiscordReady]\` ${self.user.username} is ready`)

    return true
}

export default {
    name: Events.ClientReady,
    handler,
    once: true,
    initial: true
}
