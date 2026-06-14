import { Lavaluna } from '@lacunahub/lavaluna.js'
import { BrokerClient, BrokerClientType } from '@lacunahub/letsfrag'

export const brokerClient = new BrokerClient(null, {
    type: BrokerClientType.Custom,
    redisURI: process.env.LCN_REDIS_URI
})

export const lava = new Lavaluna({
    nodes: process.env.LCN_LAVALINK_NODES.split(',').map(v => {
        const [name, hostname, port, password] = v.split(':')

        return {
            name,
            hostname,
            port: +port,
            secure: +port === 443,
            password,
            reconnectRetryAmount: 100,
            reconnectRetryDelay: 60000
        }
    }),
    clientId: process.env.LCN_DISCORD_CLIENT_ID,
    send: () => {}
})
