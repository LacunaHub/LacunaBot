import { APIUser, OAuth2Scopes, RESTPostOAuth2AccessTokenResult, SnowflakeUtil } from 'discord.js'
import { Context } from 'koa'
import database from '../../../../database'
import { supportServerId } from '../../../../internals/utility/Constants'
import APIError from '../../../utility/APIError'
import { oauth2 } from '../../../utility/DiscordOAuth2'
import DiscordUtils from '../../../utility/DiscordUtils'

export default async function exchangeCode(ctx: Context) {
    const { code, redirect_uri: redirectURI } = ctx.request.body
    let exchangedCode: RESTPostOAuth2AccessTokenResult, currentUser: APIUser

    try {
        exchangedCode = await oauth2.exchangeCode(code, redirectURI)
        currentUser = await oauth2.getUser(exchangedCode.access_token)
    } catch (err) {
        ctx.throw(500, new APIError(5020))
    }

    const userEntry = await database.users.findOne({ _id: currentUser.id })

    if (userEntry) {
        const updateData = {}

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

    ctx.status = 200
    ctx.body = {
        access_token: exchangedCode.access_token,
        refresh_token: exchangedCode.refresh_token,
        expires_in: exchangedCode.expires_in,
        user: {
            id: currentUser.id,
            username: currentUser.username,
            global_name: currentUser.global_name,
            avatar: currentUser.avatar
        }
    }
}
