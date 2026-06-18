import { oauth2 } from '@/api/utility/DiscordOAuth2.js'
import { PermissionsBitField } from 'discord.js'
import { type Context } from 'koa'

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
