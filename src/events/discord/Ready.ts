import { Events } from 'discord.js'
import { Manager } from 'erela.js'
import ErelaSpotify from 'erela.js-spotify'
import Lacuna from '../../internals/Lacuna'

const handler = async (self: Lacuna) => {
    const [identifier, host, port, password] = process.env.WINTER_MUSIC_NODE.split(':')

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
        plugins: [new ErelaSpotify({ clientID: process.env.SPOTIFY_CLIENT_ID, clientSecret: process.env.SPOTIFY_CLIENT_SECRET })],
        clientId: self.user.id,
        shards: self.options.shardCount,
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

    self.loadEvents()

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
