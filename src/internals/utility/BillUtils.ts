import moment from 'moment'
import database from '../../database'
import { IBill } from '../../database/schemas/Bills'
import { ServerDocument } from '../../database/schemas/Servers'
import logger from '../Logger'
import DiamondGuild, { diamondGuilds } from '../structures/DiamondGuild'
import Patron, { patrons } from '../structures/Patron'
import DiscordUtils from './DiscordUtils'

export const support_server_id = '740586549145763960'
export const active_patron_role_id = '968097093388468274'
export const big_patron_role_id = '896416992079265824'
export const patron_role_id = '746825813806284866'
export const server_booster_role_id = '746752483115794583'

export async function addDiamond(bill: IBill, server?: ServerDocument) {
    if (!server) {
        server = await database.servers.findOne({ _id: bill.custom_fields.reference_id })
    }

    const { diamondPrices } = await database.json.get()
    const months = diamondPrices[bill.custom_fields.tier]?.months ?? 0

    if (months > 0) {
        const date = server.server.premium.will_expire_on ? moment(server.server.premium.will_expire_on) : moment()
        let period = (bill.type === 'DISCORD_NITRO_BOOST' ? date.add(6, 'hours') : date.add(months, 'M')).valueOf()

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

        const diamondGuild = diamondGuilds.get(server._id)
        if (diamondGuild) diamondGuild.cancel()

        new DiamondGuild(server._id, period, bill._id)

        if (bill.type === 'DISCORD_NITRO_BOOST') {
            logger.log(`[BillUtils] Nitro Boost "${bill._id}" for guild ${server._id} successfully verified`)
        } else {
            await addPremium(bill, period)
            logger.log(`[BillUtils] Bill "${bill._id}" for guild ${server._id} successfully charged`)
        }
    }
}

export async function addPremium(bill: IBill, period: number) {
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

    const patron_roles = [active_patron_role_id]

    patron_roles.push(bill.custom_fields.tier >= 2 ? big_patron_role_id : patron_role_id)

    for (const role of patron_roles) {
        await DiscordUtils.restApi.put(DiscordUtils.apiRoutes.guildMemberRole(support_server_id, bill.custom_fields.user_id, role)).catch(() => {})
    }

    const patron = patrons.get(bill.custom_fields.user_id)
    if (patron) patron.cancel()

    new Patron(bill.custom_fields.user_id, period)

    logger.log(`[BillUtils] User ${bill.custom_fields.user_id} became a Patron`)
}
