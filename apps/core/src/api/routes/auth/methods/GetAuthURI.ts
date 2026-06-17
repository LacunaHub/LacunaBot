import { oauth2 } from '@/api/utility/DiscordOAuth2.js'
import { OAuth2Scopes } from 'discord.js'
import { type Context } from 'koa'

export default async function getAuthURI(ctx: Context) {
    const scope = [OAuth2Scopes.Identify, OAuth2Scopes.Guilds]

    if (ctx.query.share_email === 'true') scope.push(OAuth2Scopes.Email)
    if (ctx.query.join_support_server === 'true') scope.push(OAuth2Scopes.GuildsJoin)
    if (ctx.query.update_role_connections === 'true') scope.push(OAuth2Scopes.RoleConnectionsWrite)

    const redirectURI = (ctx.query.redirect_uri as string) || undefined
    const { url, state } = oauth2.getOAuthURL(scope, redirectURI)

    ctx.status = 200
    ctx.body = {
        uri: url.toString(),
        state
    }
}
