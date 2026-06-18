import { oauth2 } from '@/api/utility/DiscordOAuth2.js'
import { type APIUser, type RESTPostOAuth2AccessTokenResult, SnowflakeUtil } from 'discord.js'
import { type Context } from 'koa'

export default async function updateLinkedRoles(ctx: Context) {
    const code = ctx.query.code as string,
        state = ctx.query.state as string,
        savedState = ctx.cookies.get('discord_oauth_state')

    if (state !== savedState) {
        ctx.redirect(
            `${process.env.LCN_WEBSITE_URL}/authorization?status=failed&message=${encodeURIComponent('Invalid state')}`
        )

        return
    }

    let exchangedCode: RESTPostOAuth2AccessTokenResult
    let currentUser: APIUser

    try {
        exchangedCode = await oauth2.exchangeCode(code, `${process.env.LCN_API_URL}/authorize/linked-roles/callback`)
        currentUser = await oauth2.getUser(exchangedCode.access_token)
    } catch (err) {
        ctx.redirect(
            `${process.env.LCN_WEBSITE_URL}/authorization?status=failed&message=${encodeURIComponent('Failed to exchange code')}`
        )

        return
    }

    try {
        await oauth2.updateUserRoleConnection(exchangedCode.access_token, {
            platform_name: 'Lacuna',
            metadata: {
                account_created_at: new Date(SnowflakeUtil.timestampFrom(currentUser.id)).toISOString()
            }
        })
    } catch (err) {
        ctx.redirect(
            `${process.env.LCN_WEBSITE_URL}/authorization?status=failed&message=${encodeURIComponent('Failed to update role connections')}`
        )

        return
    }

    ctx.redirect(`${process.env.LCN_WEBSITE_URL}/authorization`)
}
