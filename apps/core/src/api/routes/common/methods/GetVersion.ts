import database from '@/database/index.js'
import { type Context } from 'koa'

export default async function getVersion(ctx: Context) {
    const version: string = await database.qdb.get('version')

    ctx.status = 200
    ctx.set('Content-Type', 'text/plain')
    ctx.body = version
}
