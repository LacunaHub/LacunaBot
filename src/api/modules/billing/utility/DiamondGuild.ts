import { BillDocument } from '@lacunahub/lacuna-database-driver'
import { Job, scheduleJob } from 'node-schedule'
import { addDiamond } from '..'
import database from '../../../../database'
import Logger from '../../../../internals/Logger'
import { projectTeamRoleId, serverBoosterRoleId, subscribedPatronRoleId } from '../../../../internals/utility/Constants'
import { isRolesMember } from '../providers/DiscordRoles'

export const diamondGuilds = new Map<string, DiamondGuild>()

export class DiamondGuild {
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
        this.schedule = scheduleJob(`DIAMOND:${this.guild_id}`, this.expiration, () => this.expire())
        diamondGuilds.set(this.guild_id, this)
    }

    async expire() {
        let bill: BillDocument,
            rolesMember: boolean = false

        if (this.bill_id) {
            bill = await database.bills.findOne({ _id: this.bill_id })

            if (['DISCORD_NITRO_BOOST', 'PATREON', 'BOOSTY', 'PROJECT_TEAM'].includes(bill?.type)) {
                let roleIds = [subscribedPatronRoleId]

                if (bill.type === 'DISCORD_NITRO_BOOST') {
                    roleIds = [serverBoosterRoleId]
                } else if (bill.type === 'PROJECT_TEAM') {
                    roleIds = [projectTeamRoleId]
                }

                rolesMember = await isRolesMember(bill.custom_fields.user_id, roleIds)
            }
        }

        if (rolesMember) {
            await addDiamond(bill)
        } else {
            await database.servers.updateOne(
                { _id: this.guild_id },
                {
                    $set: {
                        'premium.available': false,
                        'premium.expires_at': 0,
                        'premium.bill_id': null
                    }
                }
            )

            if (['DISCORD_NITRO_BOOST', 'PATREON', 'BOOSTY', 'PROJECT_TEAM'].includes(bill?.type)) {
                await database.bills.updateOne({ _id: bill._id }, { $set: { 'status.value': 'REJECTED' } })
            }

            Logger.info(`[DiamondGuild] Lacuna Diamond on guild ${this.guild_id} was expired`)
        }
    }

    cancel() {
        this.schedule.cancel()
        diamondGuilds.delete(this.guild_id)
    }
}

export async function handleDiamondGuilds() {
    const servers = await database.servers.find({
        'premium.available': true,
        'premium.expires_at': { $gt: 0 }
    })

    for (const server of servers) {
        const { expires_at, bill_id } = server.premium
        const diamondGuild = diamondGuilds.get(server._id)

        if (diamondGuild) continue

        new DiamondGuild(server._id, expires_at, bill_id)
    }

    Logger.log(`[DiamondGuild] Found ${servers.length} guilds with Lacuna Diamond`)
}
