import { PermissionsBitField } from 'discord.js'
import { Context } from 'koa'
import { oauth2 } from '../../../utility/DiscordOAuth2'

export default async function getBotAuthURL(ctx: Context) {
    const url = new URL(oauth2.baseAuthorizationURL)

    url.searchParams.append('client_id', oauth2.clientId)
    url.searchParams.append(
        'permissions',
        new PermissionsBitField([
            'Administrator',
            'AddReactions',
            'AttachFiles',
            'BanMembers',
            'Connect',
            'CreatePrivateThreads',
            'CreatePublicThreads',
            'EmbedLinks',
            'KickMembers',
            'ManageChannels',
            'ManageMessages',
            'ManageNicknames',
            'ManageRoles',
            'ManageWebhooks',
            'ModerateMembers',
            'MoveMembers',
            'ReadMessageHistory',
            'SendMessages',
            'SendMessagesInThreads',
            'Speak',
            'UseVAD',
            'ViewAuditLog'
        ]).bitfield.toString()
    )

    for (const i in ctx.query) {
        url.searchParams.append(i, ctx.query[i] as any)
    }

    ctx.redirect(url.toString())
}
