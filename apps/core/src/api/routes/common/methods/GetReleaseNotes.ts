import { type ReleaseNote } from '@/api/modules/ReleaseNotesLogger.js'
import database from '@/database/index.js'
import { type Context } from 'koa'

export default async function getReleaseNotes(ctx: Context) {
    const releaseNotes: ReleaseNote[] = await database.qdb.get('releaseNotes')

    ctx.status = 200
    ctx.body = releaseNotes
}
