import { Context } from 'koa'
import database from '../../../../database'
import { ReleaseNote } from '../../../modules/ReleaseNotesLogger'

export default async function getReleaseNotes(ctx: Context) {
    const releaseNotes: ReleaseNote[] = await database.qdb.get('releaseNotes')

    ctx.status = 200
    ctx.body = releaseNotes
}
