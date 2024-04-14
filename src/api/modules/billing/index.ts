import { BillDocument, ServerDocument } from '@lacunahub/lacuna-database-driver'
import database from '../../../database'
import Logger from '../../../internals/Logger'
import { activePatronRoleId, bigPatronRoleId, supportServerId } from '../../../internals/utility/Constants'
import DiscordUtils from '../../utility/DiscordUtils'
import { DiamondGuild, diamondGuilds } from './utility/DiamondGuild'
import { Patron, patrons } from './utility/Patron'

export async function addDiamond(bill: BillDocument, server?: ServerDocument) {
    if (!server) {
        server = await database.servers.findOne({ _id: bill.custom_fields.reference_id })
    }

    const diamondPrices = await database.getDiamondPrices()
    const months = diamondPrices[bill.custom_fields.tier]?.months ?? 0

    if (months > 0) {
        const date = server.premium.expires_at ? new Date(server.premium.expires_at) : new Date()
        let period = ['DISCORD_NITRO_BOOST', 'PATREON', 'BOOSTY', 'PROJECT_TEAM'].includes(bill.type)
            ? date.setHours(date.getHours() + 6)
            : date.setMonth(date.getMonth() + months)

        await database.servers.updateOne(
            { _id: server._id },
            {
                $set: {
                    'premium.available': true,
                    'premium.expires_at': period,
                    'premium.bill_id': bill._id
                }
            }
        )

        let diamondGuild = diamondGuilds.get(server._id)

        if (diamondGuild) {
            Logger.log(`[Billing] Renewing Diamond for guild ${server._id}`)
            diamondGuild.cancel()
        }

        if (bill.type === 'DISCORD_NITRO_BOOST') {
            Logger.log(`[Billing] Nitro Boost "${bill._id}" for guild ${server._id} successfully verified`)
        } else if (['PATREON', 'BOOSTY', 'PROJECT_TEAM'].includes(bill.type)) {
            Logger.log(`[Billing] Diamond Subscription "${bill._id}" for guild ${server._id} successfully verified`)
        } else {
            Logger.log(`[Billing] Bill "${bill._id}" for guild ${server._id} successfully charged`)
        }

        diamondGuild = new DiamondGuild(server._id, period, bill._id)
        const patron = await addPremium(bill, period)

        return { diamondGuild, patron }
    }
}

export async function addPremium(bill: BillDocument, period: number) {
    if (bill.type === 'DISCORD_NITRO_BOOST') return null

    await database.users.updateOne(
        { _id: bill.custom_fields.user_id },
        {
            $set: {
                'premium.available': true,
                'premium.expiration_timestamp': period,
                'premium.last_charge_timestamp': Date.now()
            }
        }
    )

    if (['QIWI', 'PAYPAL'].includes(bill.type)) {
        const userBills = await database.bills.find({
                type: { $in: ['QIWI', 'PAYPAL'] },
                'status.value': 'PAID',
                'custom_fields.user_id': bill.custom_fields.user_id
            }),
            supportedAmount = userBills.reduce(
                (x, y) => {
                    x[y.currency] += y.amount
                    return x
                },
                { RUB: 0, USD: 0 }
            )
        const patronRoles = [activePatronRoleId]

        if (supportedAmount.RUB >= 1000 || supportedAmount.USD >= 15) {
            patronRoles.push(bigPatronRoleId)
        }

        for (const role of patronRoles) {
            try {
                await DiscordUtils.rest.put(DiscordUtils.restRoutes.guildMemberRole(supportServerId, bill.custom_fields.user_id, role))
            } catch (err) {
                await Logger.handleError({ module: 'Billing', action: 'AddPatronRoles', error: err })
            }
        }
    }

    const patron = patrons.get(bill.custom_fields.user_id)

    if (patron) {
        Logger.log(`[Billing] Renewing patronage for user ${bill.custom_fields.user_id}`)
        patron.cancel()
    } else {
        Logger.log(`[Billing] User ${bill.custom_fields.user_id} became a Patron`)
    }

    // try {
    //     await DiscordUtils.rest.delete(DiscordUtils.restRoutes.guildMemberRole(supportServerId, bill.custom_fields.user_id, formerPatronRoleId))
    // } catch (err) {
    //     await Logger.handleError({ module: 'Billing', action: 'RemoveFormerPatronRole', error: err })
    // }

    return new Patron(bill.custom_fields.user_id, period)
}
