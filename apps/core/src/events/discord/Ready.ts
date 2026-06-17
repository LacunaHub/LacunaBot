import Lacuna from '@/internals/Lacuna.js'
import { Lavaluna } from '@lacunahub/lavaluna.js'
import { Events } from 'discord.js'

const handler = async (self: Lacuna) => {
    self.lava = new Lavaluna({
        nodes: process.env.LCN_LAVALINK_NODES!.split(',').map(v => {
            const [name, hostname, port, password] = v.split(':')

            return {
                name: name!,
                hostname: hostname!,
                port: +port!,
                secure: +port! === 443,
                password: password!,
                reconnectRetryAmount: 100,
                reconnectRetryDelay: 60000
            }
        }),
        clientId: self.user!.id,
        clientName: `${self.user!.username}#${self.cluster.id}`,
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

    self.logger.info({ bot: self.user }, 'client ready')

    return true
}

export default {
    name: Events.ClientReady,
    handler,
    once: true,
    initial: true
}
