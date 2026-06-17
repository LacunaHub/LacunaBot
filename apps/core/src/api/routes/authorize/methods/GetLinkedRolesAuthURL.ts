import { oauth2 } from '@/api/utility/DiscordOAuth2.js'
import { OAuth2Scopes } from 'discord.js'
import { type Context } from 'koa'

export default async function getLinkedRolesAuthURL(ctx: Context) {
    const { url, state } = oauth2.getOAuthURL(
        [OAuth2Scopes.RoleConnectionsWrite, OAuth2Scopes.Identify],
        `${process.env.LCN_API_URL}/authorize/linked-roles/callback`
    )

    ctx.cookies.set('discord_oauth_state', state, { maxAge: 5 * 60 * 1000, signed: true })
    ctx.redirect(url.toString())
}
