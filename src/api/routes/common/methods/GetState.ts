import { HostData } from '@lacunahub/letsfrag'
import { Context } from 'koa'
import fetch from 'node-fetch'
import { lava, serverClient } from '../../..'
import database from '../../../../database'
import Lacuna from '../../../../internals/Lacuna'

export default async function getState(ctx: Context) {
    const version = await database.qdb.get('version'),
        issues: string[] = await getIssues()
    let hosts: HostData[] = [],
        clusters: BotStats[] = []

    try {
        hosts = await serverClient.getHostsData()
        const broadcastResponse = await serverClient.broadcastEval<BotStats[][]>((self: Lacuna) => {
            return {
                host: self.hostname,
                clusterId: self.cluster.id,
                guilds: self.guilds.cache.size,
                users: self.guilds.cache.reduce((x, y) => (x += y.memberCount), 0),
                cachedUsers: self.users.cache.size,
                channels: self.channels.cache.size,
                latency: self.ws.ping,
                uptime: self.uptime
            }
        })

        clusters = broadcastResponse.flat().sort((a, b) => a.clusterId - b.clusterId)
    } catch (err) {}

    if (hosts.length < +process.env.LCN_SERVER_HOST_COUNT) {
        issues.push('Not all hosts are connected.')
    }

    for (const host of hosts) {
        const hostClusters = clusters.filter(v => v.host === host.hostname)

        if (hostClusters.length < host.clusters.length) {
            issues.push(`Not all shards have a connection to host **${host.hostname}**.`)
        }
    }

    const lavaNodes = [...lava.nodes.cache.values()].map(v => {
        return {
            id: v.options.name,
            connected: v.connected,
            cpu_load: +v.stats.cpu.lavalinkLoad.toFixed(2),
            memory_usage: Math.round((v.stats.memory.used * 100) / v.stats.memory.reservable),
            uptime: v.stats.uptime,
            players: {
                playing: v.stats.playingPlayers,
                total: v.stats.players
            }
        }
    })

    for (const node of lavaNodes) {
        if (!node.connected) {
            issues.push(`Player **${node.id}** is not connected.`)
        }

        if (node.cpu_load > 0.8) {
            issues.push(`Player **${node.id}** has high load.`)
        }
    }

    const charts = await getTimeseries(Date.now())

    ctx.status = 200
    ctx.body = {
        version,
        issues,
        guilds: clusters.reduce((a, b) => (a += b.guilds), 0) || 0,
        users: clusters.reduce((a, b) => (a += b.users), 0) || 0,
        cached_users: clusters.reduce((a, b) => (a += b.cachedUsers), 0) || 0,
        channels: clusters.reduce((a, b) => (a += b.channels), 0) || 0,
        shards: clusters.map(v => {
            return {
                host: v.host,
                cluster_id: v.clusterId,
                guilds: v.guilds,
                users: v.users,
                cached_users: v.cachedUsers,
                channels: v.channels,
                latency: v.latency,
                uptime: v.uptime
            }
        }),
        players: lavaNodes,
        charts: charts || {}
    }
}

async function getIssues(): Promise<string[]> {
    try {
        const response = await fetch(`${process.env.LCN_GRAFANA_URL}/api/dashboards/uid/ddj44xrritrswb`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.LCN_GRAFANA_API_KEY}`
            }
        })

        const data = await response.json(),
            issuesPanel = data?.dashboard?.panels?.find(v => v.title === 'Issues')

        if (!issuesPanel?.options?.content) return []
        return issuesPanel?.options?.content?.split(/[\r\n]{1,}/)?.map(v => v.trim()) ?? []
    } catch (err) {
        return []
    }
}

async function getTimeseries(to: number, from?: number) {
    if (typeof from !== 'number') from = to - 1000 * 60 * 60 * 12

    const queries = [
        {
            refId: 'guilds',
            expr: 'lcn_guild_counter{shard="", label=""}'
        },
        {
            refId: 'avgLatency',
            expr: 'avg(lcn_ws_ping)'
        }
    ]

    try {
        const response = await fetch(`${process.env.LCN_GRAFANA_URL}/api/ds/query`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.LCN_GRAFANA_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    queries: queries.map(v => {
                        return {
                            datasource: {
                                type: 'prometheus',
                                uid: process.env.LCN_GRAFANA_DATASOURCE_UID
                            },
                            ...v
                        }
                    }),
                    from: from.toString(),
                    to: to.toString()
                })
            }),
            data: GrafanaQueryResponse = await response.json()

        const frames = queries.map(v => {
            const frame = data.results[v.refId].frames.find(vv => vv.schema.refId === v.refId)
            return { refId: v.refId, ...frame }
        })

        let timeseries: Record<string, Array<number[]>> = {}
        for (const frame of frames) {
            const value: Array<number[]> = []

            for (let i = 0; i < frame.data.values[0].length; i++) {
                const timestamp = frame.data.values[0][i],
                    data = frame.data.values[1][i]

                value.push([timestamp, data])
            }

            timeseries[frame.refId] = value
        }

        return timeseries
    } catch (err) {}
}

export interface BotStats {
    host: string
    clusterId: number
    guilds: number
    users: number
    cachedUsers: number
    channels: number
    latency: number
    uptime: number
}

interface GrafanaQueryResponse {
    results: Record<string, GrafanaQuery>
}

interface GrafanaQuery {
    error?: string
    errorSource?: string
    status: number
    frames: GrafanaQueryFrame[]
}

interface GrafanaQueryFrame {
    schema: GrafanaQueryFrameSchema
    data: GrafanaQueryFrameData
}

interface GrafanaQueryFrameSchema {
    refId: string
    meta: GrafanaQueryFrameSchemaMeta
    fields: GrafanaQueryFrameSchemaField[]
}

interface GrafanaQueryFrameSchemaMeta {
    type: string
    typeVersion: number[]
    custom: GrafanaQueryFrameSchemaMetaCustom
    executedQueryString: string
}

interface GrafanaQueryFrameSchemaMetaCustom {
    resultType: string
}

interface GrafanaQueryFrameSchemaField {
    name: string
    type: string
    typeInfo: GrafanaQueryFrameSchemaFieldTypeInfo
    config: GrafanaQueryFrameSchemaFieldConfig
    labels?: GrafanaQueryFrameSchemaFieldLabels
}

interface GrafanaQueryFrameSchemaFieldTypeInfo {
    frame: string
    [key: string]: any
}

interface GrafanaQueryFrameSchemaFieldConfig {
    interval: number
    displayNameFromDS?: string
    [key: string]: any
}

interface GrafanaQueryFrameSchemaFieldLabels {
    __name__: string
    instance: string
    job: string
}

interface GrafanaQueryFrameData {
    values: Array<number[]>
}
