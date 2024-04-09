import { OAuth2Scopes } from 'discord.js'
import { Context } from 'koa'
import { oauth2 } from '../../../utility/DiscordOAuth2'

export default async function getAuthURL(ctx: Context) {
    const scope = [OAuth2Scopes.Identify, OAuth2Scopes.Guilds]

    if (ctx.query.share_email === 'true') scope.push(OAuth2Scopes.Email)
    if (ctx.query.join_support_server === 'true') scope.push(OAuth2Scopes.GuildsJoin)

    const { url, state } = oauth2.getOAuthURL(scope)

    ctx.cookies.set('discord_oauth_state', state, { maxAge: 5 * 60 * 1000, signed: true })
    ctx.redirect(url.toString())
}
