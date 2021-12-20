import { ShardingManager, ShardingManagerOptions } from 'discord.js'
import { scheduleStatsCollect } from './Statistics'
import { syncBills as syncQiwiBills } from './Qiwi'
import Diamonder, { createDiamonders } from '../structures/Diamonder'
import { Job } from 'node-schedule'

export default class LacunaSharding extends ShardingManager {
    public readiness: number[]
    public diamodned: Map<string, Diamonder>
    public qiwi_bills_schedule: Job
    public stats_collect_schedule: Job

    constructor(file: string, options: ShardingManagerOptions) {
        super(file, options)

        this.readiness = []

        this.diamodned = new Map()

        this.qiwi_bills_schedule = syncQiwiBills()

        this.stats_collect_schedule = scheduleStatsCollect(this)

        createDiamonders(this)
    }
}