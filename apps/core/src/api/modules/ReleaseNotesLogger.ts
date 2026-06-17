import Logger from '@/api/utility/Logger.js'
import database from '@/database/index.js'
import fetch from 'node-fetch'
import { Job, Range, RecurrenceRule, scheduleJob } from 'node-schedule'

export async function getReleaseNotes() {
    try {
        const response = await fetch(
            'https://raw.githubusercontent.com/LacunaHub/LacunaDocs/master/docs/other/change-log.mdx',
            { method: 'GET' }
        )

        if (response.ok) {
            const content = await response.text(),
                headerRegexp = /###?\s\d+\.\d+[\.\d]*/

            const versions = content.match(new RegExp(headerRegexp, 'g'))!,
                contentParts = content.split(headerRegexp)
            const releaseNotes: ReleaseNote[] = []

            contentParts.shift()

            for (const version of versions) {
                const i = versions.indexOf(version)

                releaseNotes.push({
                    version: version.replace(/###?\s/, ''),
                    content: contentParts[i]!.replace(/\d+\.\d+\.20\d+/, '').trim()
                })
            }

            return releaseNotes
        }

        throw new Error(`Failed to get release notes with status code ${response.status}`)
    } catch (err) {
        Logger.error({ err }, 'failed to get release notes')
    }
}

function createSchedule(): Job {
    const rule = new RecurrenceRule()
    rule.minute = new Range(0, 59, 30)

    const job = scheduleJob('releaseNotesLogger', rule, async () => {
        const releaseNotes = await getReleaseNotes()
        await database.qdb.set('releaseNotes', releaseNotes)
    })

    return job
}

export default {
    getReleaseNotes,
    createSchedule
}

export interface ReleaseNote {
    version: string
    content: string
}
