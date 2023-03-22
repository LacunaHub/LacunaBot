import { Job, scheduleJob } from 'node-schedule'
import database from '../../database'
import { IBill } from '../../database/schemas/Bills'
import logger from '../Logger'
import { addDiamond } from '../utility/BillUtils'
import { isNitroBooster } from '../utility/DiscordNitroBoost'

export const diamondGuilds = new Map<string, DiamondGuild>()

export default class DiamondGuild {
    public guild_id: string
    public expiration: number
    public bill_id?: string
    public schedule: Job

    constructor(guild_id: string, expiration: number, bill_id?: string) {
        this.guild_id = guild_id

        this.expiration = expiration

        this.bill_id = bill_id

        this.schedule = null

        if (Date.now() >= this.expiration || this.expiration - Date.now() <= 30000) {
            this.expire()

            return
        }

        this.initialize()
    }

    initialize() {
        this.schedule = scheduleJob(`DIAMOND-GUILD:${this.guild_id}`, this.expiration, () => this.expire())
        diamondGuilds.set(this.guild_id, this)
    }

    async expire() {
        let bill: IBill,
            nitroBooster: boolean = false

        if (this.bill_id) {
            bill = await database.bills.findOne({ _id: this.bill_id })

            if (bill?.type === 'DISCORD_NITRO_BOOST') {
                nitroBooster = await isNitroBooster(bill.custom_fields.user_id)
            }
        }

        if (nitroBooster) {
            await addDiamond(bill)
        } else {
            await database.servers.updateOne(
                { _id: this.guild_id },
                {
                    $set: {
                        'server.premium.available': false,
                        'server.premium.will_expire_on': 0,
                        'server.premium.bill_id': null
                    }
                }
            )

            if (bill?.type === 'DISCORD_NITRO_BOOST') {
                await database.bills.updateOne({ _id: bill._id }, { $set: { 'status.value': 'REJECTED' } })
            }

            logger.info(`[DiamondGuild] Lacuna Diamond on guild ${this.guild_id} was expired`)
        }
    }

    cancel() {
        this.schedule.cancel()
        diamondGuilds.delete(this.guild_id)
    }
}

export async function handleDiamondGuilds() {
    const servers = await database.servers.find({ 'server.premium.available': true, 'server.premium.will_expire_on': { $gt: 0 } })

    for (const server of servers) {
        const { will_expire_on, bill_id } = server.server.premium

        new DiamondGuild(server._id, will_expire_on, bill_id)
    }

    logger.log(`[DiamondGuild] Found ${servers.length} guilds with Lacuna Diamond`)
}
