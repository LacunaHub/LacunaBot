import { Context, Next } from 'koa'
import koaRatelimit from 'koa-ratelimit'
import database from '../../database'
import APIError from './APIError'

export async function passKnownReferrers(ctx: Context, next: Next): Promise<any> {
    const referer = ctx.request.headers.referer
    const { allowedAPIReferrers, publicAPIPaths } = await database.getInternalData()

    if (process.env.NODE_ENV === 'development') {
        return await next()
    }

    const isAllowedReferrer = referer && allowedAPIReferrers.some(v => referer.includes(v)),
        isAllowedPath = publicAPIPaths.some(v => ctx.url.startsWith(v))

    if (!isAllowedReferrer && !isAllowedPath) {
        ctx.throw(503, new APIError())
    }

    return await next()
}

export function createRateLimit(max: number, duration: number = 60000) {
    return koaRatelimit({
        driver: 'memory',
        db: new Map(),
        duration,
        max,
        throw: true,
        id: ctx => (ctx.request.headers['x-forwarded-for'] as string) || ctx.ip
    })
}
