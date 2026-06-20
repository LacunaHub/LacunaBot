import APIError from '@/api/utility/APIError.js'
import { type UserState } from '@/api/utility/Authentication.js'
import database from '@/database/index.js'
import { type Context } from 'koa'

export default async function getCurrentUserActivities(ctx: Context) {
    const currentUser: UserState = ctx.state.user,
        user = await database.users.findOne({ _id: currentUser.id }).lean()

    if (!user) {
        ctx.throw(404, new APIError(1001))
    }

    ctx.status = 200
    ctx.body = {
        levels: user.activities.levels
    }
}
