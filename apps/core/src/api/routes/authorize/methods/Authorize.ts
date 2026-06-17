import { oauth2 } from '@/api/utility/DiscordOAuth2.js'
import DiscordUtils from '@/api/utility/DiscordUtils.js'
import database from '@/database/index.js'
import { supportServerId } from '@/internals/utility/Constants.js'
import { type APIUser, OAuth2Scopes, type RESTPostOAuth2AccessTokenResult, SnowflakeUtil } from 'discord.js'
import { type Context } from 'koa'

export default async function authorize(ctx: Context) {
    if (ctx.query.error) {
        ctx.redirect(
            `${process.env.LCN_WEBSITE_URL}/authorization?status=failed&message=${encodeURIComponent(ctx.query.error as string)}`
        )

        return
    }

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
        exchangedCode = await oauth2.exchangeCode(code)
        currentUser = await oauth2.getUser(exchangedCode.access_token)
    } catch (err) {
        ctx.redirect(
            `${process.env.LCN_WEBSITE_URL}/authorization?status=failed&message=${encodeURIComponent('Failed to exchange code')}`
        )

        return
    }

    const userEntry = await database.users.findOne({ _id: currentUser.id })
    const cookieOptions = {
        maxAge: exchangedCode.expires_in * 1000,
        domain: process.env.LCN_ROOT_DOMAIN,
        httpOnly: false
    }

    ctx.cookies
        .set('access_token', exchangedCode.access_token, cookieOptions)
        .set('refresh_token', exchangedCode.refresh_token, { domain: process.env.LCN_ROOT_DOMAIN, httpOnly: false })

    ctx.cookies
        .set('user_id', currentUser.id, cookieOptions)
        .set('user_username', currentUser.username, cookieOptions)
        .set('user_global_name', encodeURIComponent(currentUser.global_name!), cookieOptions)

    if (currentUser.avatar) ctx.cookies.set('user_avatar', currentUser.avatar, cookieOptions)

    if (userEntry) {
        const updateData: Record<string, any> = {}

        if (userEntry.user.username !== currentUser.username) {
            updateData['user.username'] = currentUser.username
        }

        if (userEntry.user.avatar !== currentUser.avatar) {
            updateData['user.avatar'] = currentUser.avatar
        }

        if (userEntry.user.flags !== currentUser.public_flags) {
            updateData['user.flags'] = currentUser.public_flags
        }

        if (userEntry.user.global_name !== currentUser.global_name) {
            updateData['user.global_name'] = currentUser.global_name
        }

        if (userEntry.user.email !== currentUser.email) {
            updateData['user.email'] = currentUser.email ?? null
        }

        if (Object.keys(updateData).length) {
            await database.users.updateOne(
                { _id: currentUser.id },
                {
                    $set: updateData
                }
            )

            if (exchangedCode.scope.includes(OAuth2Scopes.RoleConnectionsWrite)) {
                try {
                    await oauth2.updateUserRoleConnection(exchangedCode.access_token, {
                        platform_name: 'Lacuna',
                        metadata: {
                            account_created_at: new Date(SnowflakeUtil.timestampFrom(currentUser.id)).toISOString()
                        }
                    })
                } catch (err) {}
            }
        }
    } else {
        await database.users.create({
            _id: currentUser.id,
            user: {
                username: currentUser.username,
                discriminator: currentUser.discriminator,
                avatar: currentUser.avatar,
                flags: currentUser.public_flags,
                global_name: currentUser.global_name,
                email: currentUser.email ?? null
            }
        })
    }

    if (exchangedCode.scope.includes(OAuth2Scopes.GuildsJoin)) {
        try {
            await DiscordUtils.rest.put(DiscordUtils.restRoutes.guildMember(supportServerId, currentUser.id), {
                body: {
                    access_token: exchangedCode.access_token
                }
            })
        } catch (err) {}
    }

    ctx.redirect(
        ctx.query.guild_id
            ? `${process.env.LCN_WEBSITE_URL}/guilds/${ctx.query.guild_id}/settings`
            : `${process.env.LCN_WEBSITE_URL}/@me/guilds`
    )
}
