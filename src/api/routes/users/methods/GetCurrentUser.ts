import { PermissionsBitField, RESTAPIPartialCurrentUserGuild } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../database'
import APIError from '../../../utility/APIError'
import { UserState } from '../../../utility/Authentication'
import { oauth2 } from '../../../utility/DiscordOAuth2'
import DiscordUtils from '../../../utility/DiscordUtils'

export default async function getCurrentUser(ctx: Context) {
    const currentUser: UserState = ctx.state.user,
        user = await database.users.findOne({ _id: currentUser.id })

    if (!user) {
        ctx.throw(404, new APIError(1001))
    }

    let guilds: RESTAPIPartialCurrentUserGuild[]

    try {
        guilds = await oauth2.getUserGuilds(ctx.request.headers.authorization)
    } catch (err) {}

    if (!guilds) {
        ctx.throw(400, new APIError(5001))
    }

    for (const guild of guilds) {
        const permissions = new PermissionsBitField(BigInt(guild.permissions)),
            permitted = !!(guild.owner || permissions.has(PermissionsBitField.Flags.Administrator))

        if (permitted) {
            let me: any

            try {
                me = await DiscordUtils.rest.get(DiscordUtils.restRoutes.guildMember(guild.id, process.env.LCN_DISCORD_CLIENT_ID))
            } catch (err) {}

            guild['joined'] = !!me
        }

        guild['permitted'] = permitted
    }

    ctx.status = 200
    ctx.body = {
        user: {
            id: user._id,
            ...user.user
        },
        guilds,
        premium: {
            available: user.premium.available,
            expires_at: user.premium.expiration_timestamp
        },
        tokens: user.tokens
    }
}
