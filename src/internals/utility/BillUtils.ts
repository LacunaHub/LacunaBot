import moment from 'moment'
import { sharding } from '../..'
import database from '../../database'
import { IBill } from '../../database/schemas/Bills'
import { ServerDocument } from '../../database/schemas/Servers'
import logger from '../Logger'
import DiamondGuild from '../structures/DiamondGuild'
import Patron from '../structures/Patron'
import DiscordUtils from './DiscordUtils'

export async function addDiamond(bill: IBill, server: ServerDocument) {
    const { diamondPrices } = await database.json.get()
    const months = diamondPrices[bill.custom_fields.tier]?.months ?? 0

    if (months > 0) {
        const period = server.server.premium.will_expire_on
            ? moment(server.server.premium.will_expire_on).add(months, 'M').valueOf()
            : moment().add(months, 'M').valueOf()

        await database.servers.updateOne(
            { _id: bill.custom_fields.reference_id },
            {
                $set: {
                    'server.premium.available': true,
                    'server.premium.will_expire_on': period
                }
            }
        )

        const diamondGuild = sharding.diamondGuilds.get(bill.custom_fields.reference_id)
        if (diamondGuild) diamondGuild.cancel()

        new DiamondGuild(sharding, bill.custom_fields.reference_id, period)

        await addPremium(bill, period)

        logger.log(`[BillUtils] Bill "${bill._id}" for guild ${bill.custom_fields.reference_id} successfully charged`)
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

    const support_server_id = '740586549145763960',
        patron_roles = ['968097093388468274']

    patron_roles.push(bill.amount > 500 ? '896416992079265824' : '746825813806284866')

    for (const role of patron_roles) {
        await DiscordUtils.restApi.put(DiscordUtils.apiRoutes.guildMemberRole(support_server_id, bill.custom_fields.user_id, role)).catch(() => {})
    }

    const patron = sharding.patrons.get(bill.custom_fields.user_id)
    if (patron) patron.cancel()

    new Patron(sharding, bill.custom_fields.user_id, period)

    logger.log(`[BillUtils] User ${bill.custom_fields.user_id} became a Patron`)
}
