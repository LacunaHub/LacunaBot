import { RESTAPIPartialCurrentUserGuild } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../database'
import APIError from '../../../utility/APIError'
import { UserState } from '../../../utility/Authentication'
import { oauth2 } from '../../../utility/DiscordOAuth2'

export default async function getCurrentUserDiamondGuilds(ctx: Context) {
    const currentUser: UserState = ctx.state.user,
        user = await database.users.findOne({ _id: currentUser.id })

    if (!user) {
        ctx.throw(404, new APIError(1001))
    }

    let guilds: RESTAPIPartialCurrentUserGuild[] = []

    try {
        guilds = await oauth2.getUserGuilds(ctx.request.headers.authorization)
    } catch (err) {}

    const servers = await database.servers.find({
        _id: { $in: guilds.map(i => i.id) },
        'premium.available': true,
        'premium.charged_via': { $ne: null }
    })

    ctx.status = 200
    ctx.body = guilds.filter(i => i.owner && servers.some(ii => ii._id === i.id))
}
