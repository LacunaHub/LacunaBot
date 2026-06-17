import APIError from '@/api/utility/APIError.js'
import { type UserState } from '@/api/utility/Authentication.js'
import { oauth2 } from '@/api/utility/DiscordOAuth2.js'
import database from '@/database/index.js'
import { type RESTAPIPartialCurrentUserGuild } from 'discord.js'
import { type Context } from 'koa'

export default async function getCurrentUserDiamondGuilds(ctx: Context) {
    const currentUser: UserState = ctx.state.user,
        user = await database.users.findOne({ _id: currentUser.id })

    if (!user) {
        ctx.throw(404, new APIError(1001))
    }

    let guilds: RESTAPIPartialCurrentUserGuild[] = []

    try {
        guilds = await oauth2.getUserGuilds(ctx.request.headers.authorization!)
    } catch (err) {}

    const servers = await database.servers.find({
        _id: { $in: guilds.map(i => i.id) },
        'premium.available': true,
        'premium.charged_via': { $ne: null }
    })

    ctx.status = 200
    ctx.body = guilds.filter(i => i.owner && servers.some(ii => ii._id === i.id))
}
