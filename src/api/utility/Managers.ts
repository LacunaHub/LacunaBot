import { LavalunaManager } from '@lacunahub/lavaluna.js'
import { BrokerClient } from '@lacunahub/letsfrag'

export const brokerClient = new BrokerClient(null, {
    type: 'custom',
    redis: process.env.LCN_REDIS_URI
})

export const lava = new LavalunaManager({
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
