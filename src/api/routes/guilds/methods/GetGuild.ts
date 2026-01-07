import { ServerDocument, ServerWebPageCategory, ServerWebPageSocialLinkType } from '@/database/schemas/Servers'
import { APIGuild, makeURLSearchParams } from 'discord.js'
import { Context } from 'koa'
import APIError from '../../../utility/APIError'
import DiscordUtils from '../../../utility/DiscordUtils'

export default async function getGuild(ctx: Context) {
    const server: ServerDocument = ctx.state.server
    let guild: APIGuild

    try {
        guild = (await DiscordUtils.rest.get(DiscordUtils.restRoutes.guild(server._id), {
            query: makeURLSearchParams({ with_counts: true })
        })) as any
    } catch (err) {
        ctx.throw(500, new APIError(5021))
    }

    const webPage = {
        categories: [],
        summary: null,
        description: null,
        social_links: []
    }

    if (server.web_page.active) {
        webPage.categories = server.web_page.categories.map(v => ServerWebPageCategory[v])
        webPage.summary = server.web_page.summary
        webPage.description = server.web_page.description
        webPage.social_links = server.web_page.social_links.map(v => ({ type: ServerWebPageSocialLinkType[v.type], url: v.url }))
    }

    ctx.status = 200
    ctx.body = {
        id: guild.id,
        name: guild.name,
        icon_url: guild.icon ? DiscordUtils.rest.cdn.icon(guild.id, guild.icon, { size: 256 }) : null,
        splash_url: guild.splash ? DiscordUtils.rest.cdn.splash(guild.id, guild.splash, { size: 1024 }) : null,
        discovery_splash_url: guild.discovery_splash ? DiscordUtils.rest.cdn.discoverySplash(guild.id, guild.discovery_splash, { size: 1024 }) : null,
        owner_id: guild.owner_id,
        role_count: guild.roles.length,
        emoji_count: guild.emojis.length,
        features: guild.features,
        categories: webPage.categories,
        summary: webPage.summary ?? guild.description ?? null,
        description: webPage.description,
        banner_url: guild.banner ? DiscordUtils.rest.cdn.banner(guild.id, guild.banner, { size: 512 }) : null,
        premium_tier: guild.premium_tier,
        premium_subscription_count: guild.premium_subscription_count ?? 0,
        preferred_locale: guild.preferred_locale,
        social_links: webPage.social_links,
        approximate_member_count: guild.approximate_member_count,
        approximate_presence_count: guild.approximate_presence_count,
        sticker_count: guild.stickers?.length ?? 0
    }
}
