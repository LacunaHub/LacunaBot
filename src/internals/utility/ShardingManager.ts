import { ShardingManager, ShardingManagerOptions } from 'discord.js'
import { Job } from 'node-schedule'
import { hubRefreshSubscriptions } from '../../modules/YouTube'
import DiamondGuild, { handleDiamondGuilds } from '../structures/DiamondGuild'
import Patron, { handlePatrons } from '../structures/Patron'
import { syncBills as syncQiwiBills } from './Qiwi'
import { scheduleStatsCollect } from './Statistics'

export default class LacunaSharding extends ShardingManager {
    public readiness: number[]
    public diamondGuilds: Map<string, DiamondGuild>
    public patrons: Map<string, Patron>
    public qiwiBillsSchedule: Job
    public statsCollectorSchedule: Job

    constructor(file: string, options: ShardingManagerOptions) {
        super(file, options)

        this.readiness = []

        this.diamondGuilds = new Map()

        this.patrons = new Map()

        this.qiwiBillsSchedule = syncQiwiBills()

        this.statsCollectorSchedule = scheduleStatsCollect(this)

        handleDiamondGuilds(this)
        handlePatrons(this)
        hubRefreshSubscriptions()
    }
}
