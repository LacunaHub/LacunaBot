import { Context } from 'koa'
import database from '../../../../database'

export default async function getVersion(ctx: Context) {
    const version: string = await database.qdb.get('version')

    ctx.status = 200
    ctx.set('Content-Type', 'text/plain')
    ctx.body = version
}
