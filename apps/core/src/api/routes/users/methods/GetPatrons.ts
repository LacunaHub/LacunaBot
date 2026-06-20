import database from '@/database/index.js'
import { type Context } from 'koa'

export default async function getPatrons(ctx: Context) {
    const patrons = await database.users.find({ 'premium.last_charge_timestamp': { $ne: null } }).lean()
    const yearInSeconds = 60 * 60 * 24 * 365

    ctx.status = 200
    ctx.body = patrons.map(i => {
        return {
            id: i._id,
            avatar: i.user.avatar,
            username: i.user.username,
            is_active: i.premium.available,
            is_long_term: i.premium.for_how_long >= yearInSeconds
        }
    })
}
