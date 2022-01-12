import { Manager } from 'erela.js'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna) => {
    const [ identifier, host, port, password ] = process.env.WINTER_MUSIC_NODE.split(':')

    self.player = new Manager({
        nodes: [
            {
                identifier,
                host,
                port: Number(port),
                password,
                retryAmount: 50,
                retryDelay: 60000
            }
        ],
        clientId: self.user.id,
        shards: Number(process.env.CLIENT_MAX_SHARDS),
        send(id, payload) {
            const guild = self.guilds.cache.get(id)

            if (guild) guild.shard.send(payload)
        }
    })
    .on('nodeConnect', node => self.emit('nodeConnect', node))
    .on('nodeDisconnect', (node, reason) => self.emit('nodeDisconnect', node, reason))
    .on('nodeError', (node, error) => self.emit('nodeError', node, error))
    .on('nodeReconnect', node => self.emit('nodeReconnect', node))
    .on('playerDestroy', player => self.emit('playerDestroy', player))
    .on('queueEnd', player => self.emit('queueEnd', player))
    .on('trackEnd', player => self.emit('trackEnd', player))

    self.player.init(self.user.id)

    self.loadCommands()
    self.loadEvents()

    const start_ms = Date.now() - self.readyTimestamp

    self.logger.info(`(Ready): ${self.user.username} started for ${start_ms}ms`)
    await self.logger.telegram.info(`\`Ready:\` ${self.user.username} started for ${start_ms}ms`)

    return true
}

export default {
    name: 'ready',
    handler,
    once: true,
    initial: true
}