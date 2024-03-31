import { Context } from 'koa'
import database from '../../../../database'
import { UserState } from '../../../utility/Authentication'

export default async function getCurrentUserBills(ctx: Context) {
    const currentUser: UserState = ctx.state.user,
        currentUserBills = await database.bills.find({
            'custom_fields.user_id': currentUser.id,
            type: { $ne: 'DISCORD_NITRO_BOOST' }
        })

    ctx.status = 200
    ctx.body = currentUserBills.reverse()
}
