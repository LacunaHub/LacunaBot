import Logger from '@/api/utility/Logger'
import database from '@/database'
import { PaymentDocument } from '@/database/schemas/Payments'
import { SubscriptionDocument, SubscriptionStatus, SubscriptionType } from '@/database/schemas/Subscriptions'
import { APIGuild } from 'discord.js'
import { Job, scheduleJob } from 'node-schedule'
import { addDiamond } from '..'
import { projectTeamRoleId, serverBoosterRoleId, subscribedPatronRoleId } from '../../../../internals/utility/Constants'
import DiscordUtils from '../../../utility/DiscordUtils'
import { isRolesMember } from '../providers/DiscordRoles'

export const diamondGuilds = new Map<string, DiamondGuild>()

export class DiamondGuild {
    public guildId: string
    public expiresAt: number
    public billId: string
    public billType: string
    public schedule: Job

    constructor(guildId: string, expiresAt: number, billId: string, billType: string) {
        this.guildId = guildId

        this.expiresAt = expiresAt

        this.billId = billId

        this.billType = billType

        this.schedule = null

        if (Date.now() >= this.expiresAt || this.expiresAt - Date.now() <= 30000) {
            this.expire()

            return
        }

        this.initialize()
    }

    initialize() {
        this.schedule = scheduleJob(`DIAMOND:${this.guildId}`, this.expiresAt, this.expire.bind(this))
        diamondGuilds.set(this.guildId, this)
    }

    async expire() {
        let bill: PaymentDocument | SubscriptionDocument

        if (this.billType === 'Payment') {
            bill = await database.payments.findOne({ _id: this.billId })
        } else if (this.billType === 'Subscription') {
            bill = await database.subscriptions.findOne({ _id: this.billId })
        }

        let renewDiamond = false

        if ('subscriber_id' in bill) {
            let roleIds = [subscribedPatronRoleId]

            if (bill.type === SubscriptionType.DiscordNitroBoost) {
                roleIds = [serverBoosterRoleId]
            } else if (bill.type === SubscriptionType.ProjectTeam) {
                roleIds = [projectTeamRoleId]
            }

            renewDiamond = await isRolesMember(bill.subscriber_id, roleIds)
        }

        if (renewDiamond) {
            await addDiamond(bill)
        } else {
            await database.servers.updateOne(
                { _id: this.guildId },
                {
                    $set: {
                        'premium.available': false,
                        'premium.expires_at': null,
                        'premium.charged_via': null
                    }
                }
            )

            if ('subscriber_id' in bill) {
                await database.subscriptions.updateOne(
                    { _id: bill._id },
                    {
                        $set: {
                            status: SubscriptionStatus.Cancelled,
                            updated_at: Date.now()
                        }
                    }
                )
            }

            Logger.info({ guildId: this.guildId, billId: this.billId }, 'diamond expired')

            try {
                const guild = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guild(this.guildId))) as APIGuild

                if (guild.system_channel_id) {
                    await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelMessages(guild.system_channel_id), {})
                }
            } catch (err) {}
        }
    }

    cancel() {
        this.schedule.cancel()
        diamondGuilds.delete(this.guildId)
    }
}

export async function handleDiamondGuilds() {
    const servers = await database.servers.find({
        'premium.available': true,
        'premium.expires_at': { $gt: 0 }
    })

    for (const server of servers) {
        const { expires_at, charged_via } = server.premium,
            [billType, billId] = charged_via?.split(':') ?? []
        const diamondGuild = diamondGuilds.get(server._id)

        if (diamondGuild) continue

        new DiamondGuild(server._id, expires_at, billId, billType)
    }

    Logger.info({ count: servers.length }, 'servers with diamond loaded')
}
