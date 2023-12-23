import moment from 'moment'
import database from '../../../database'
import { IBill } from '../../../database/schemas/Bills'
import { ServerDocument } from '../../../database/schemas/Servers'
import logger from '../../Logger'
import DiamondGuild, { diamondGuilds } from '../../structures/DiamondGuild'
import Patron, { patrons } from '../../structures/Patron'
import DiscordUtils from '../DiscordUtils'

export const support_server_id = '740586549145763960'
export const project_team_role_id = '746825558205136926'
export const subscribed_patron_role_id = '1140832301228490872'
export const active_patron_role_id = '968097093388468274'
export const big_patron_role_id = '896416992079265824'
export const former_patron_role_id = '746825813806284866'
export const server_booster_role_id = '746752483115794583'

export async function addDiamond(bill: IBill, server?: ServerDocument) {
    if (!server) {
        server = await database.servers.findOne({ _id: bill.custom_fields.reference_id })
    }

    const { diamondPrices } = await database.json.get()
    const months = diamondPrices[bill.custom_fields.tier]?.months ?? 0

    if (months > 0) {
        const date = server.server.premium.will_expire_on ? moment(server.server.premium.will_expire_on) : moment()
        let period = (['DISCORD_NITRO_BOOST', 'PATREON', 'BOOSTY'].includes(bill.type) ? date.add(6, 'hours') : date.add(months, 'M')).valueOf()

        await database.servers.updateOne(
            { _id: server._id },
            {
                $set: {
                    'server.premium.available': true,
                    'server.premium.will_expire_on': period,
                    'server.premium.bill_id': bill._id
                }
            }
        )

        let diamondGuild = diamondGuilds.get(server._id)

        if (diamondGuild) {
            logger.log(`[Billing] Renewing Diamond for guild ${server._id}`)
            diamondGuild.cancel()
        }

        if (bill.type === 'DISCORD_NITRO_BOOST') {
            logger.log(`[Billing] Nitro Boost "${bill._id}" for guild ${server._id} successfully verified`)
        } else if (['PATREON', 'BOOSTY'].includes(bill.type)) {
            logger.log(`[Billing] Diamond Subscription "${bill._id}" for guild ${server._id} successfully verified`)
        } else {
            logger.log(`[Billing] Bill "${bill._id}" for guild ${server._id} successfully charged`)
        }

        diamondGuild = new DiamondGuild(server._id, period, bill._id)
        const patron = await addPremium(bill, period)

        return { diamondGuild, patron }
    }
}

export async function addPremium(bill: IBill, period: number) {
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
        const patronRoles = [active_patron_role_id]

        if (supportedAmount.RUB >= 1000 || supportedAmount.USD >= 15) {
            patronRoles.push(big_patron_role_id)
        }

        for (const role of patronRoles) {
            try {
                await DiscordUtils.restApi.put(DiscordUtils.apiRoutes.guildMemberRole(support_server_id, bill.custom_fields.user_id, role))
            } catch (err) {
                await logger.handleError({ module: 'Billing', action: 'AddPatronRoles', error: err })
            }
        }
    }

    const patron = patrons.get(bill.custom_fields.user_id)

    if (patron) {
        logger.log(`[Billing] Renewing patronage for user ${bill.custom_fields.user_id}`)
        patron.cancel()
    } else {
        logger.log(`[Billing] User ${bill.custom_fields.user_id} became a Patron`)
    }

    // try {
    //     await DiscordUtils.restApi.delete(
    //         DiscordUtils.apiRoutes.guildMemberRole(support_server_id, bill.custom_fields.user_id, former_patron_role_id)
    //     )
    // } catch (err) {
    //     await logger.handleError({ module: 'Billing', action: 'RemoveFormerPatronRole', error: err })
    // }

    return new Patron(bill.custom_fields.user_id, period)
}
