import { Context } from 'koa'
import database from '../../../../database'
import APIError from '../../../utility/APIError'
import { UserState } from '../../../utility/Authentication'

export default async function getCurrentUserActivities(ctx: Context) {
    const currentUser: UserState = ctx.state.user,
        user = await database.users.findOne({ _id: currentUser.id })

    if (!user) {
        ctx.throw(404, new APIError(1001))
    }

    ctx.status = 200
    ctx.body = {
        levels: user.activities.levels
    }
}
