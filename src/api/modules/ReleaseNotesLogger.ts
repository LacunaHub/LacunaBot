import { Message } from 'discord.js'
import { Job, Range, RecurrenceRule, scheduleJob } from 'node-schedule'
import database from '../../database'
import Logger from '../../internals/Logger'
import { newsChannelId, newsRoleId } from '../../internals/utility/Constants'
import DiscordUtils from '../utility/DiscordUtils'

export async function getReleaseNotes() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/LacunaHub/Docs/master/other/change-log.md', { method: 'GET' })

        if (response.ok) {
            const content = await response.text(),
                headerRegexp = /###?\s\d+\.\d+[\.\d]*/

            const versions = content.match(new RegExp(headerRegexp, 'g')),
                contentParts = content.split(headerRegexp)
            const releaseNotes: IReleaseNote[] = []

            contentParts.shift()

            for (const version of versions) {
                const i = versions.indexOf(version)

                releaseNotes.push({
                    version: version.replace(/###?\s/, ''),
                    content: contentParts[i].replace(/\d+\.\d+\.20\d+/, '').trim()
                })
            }

            return releaseNotes
        }

        throw new Error(`[ReleaseNotesLogger] Failed to get release notes with status code ${response.status}`)
    } catch (err) {
        Logger.error(err)
    }
}

function createSchedule(): Job {
    if (!newsChannelId) {
        Logger.warn('[ReleaseNotesLogger] News channel is not specified')

        return
    }

    const rule = new RecurrenceRule()
    rule.minute = new Range(0, 59, 30)

    const job = scheduleJob('releaseNotesLogger', rule, async () => {
        const releaseNotes = await getReleaseNotes(),
            latestRelease = releaseNotes?.at?.(0)
        const latestReleaseNoteVersion = await database.qdb.get('latestReleaseNoteVersion')

        if (!latestRelease) return null
        if (latestRelease.version === latestReleaseNoteVersion) return null

        const message = (await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelMessages(newsChannelId), {
            body: {
                content: `# Обновление ${latestRelease.version} ${newsRoleId ? `<@&${newsRoleId}>` : ''}\n\n${latestRelease.content}`
            }
        })) as Message

        await database.qdb.set('latestReleaseNoteVersion', latestRelease.version)
        await DiscordUtils.rest.post(DiscordUtils.restRoutes.channelMessageCrosspost(newsChannelId, message.id))
        await DiscordUtils.rest.post(DiscordUtils.restRoutes.threads(newsChannelId, message.id), {
            body: {
                name: `Обновление ${latestRelease.version}`
            }
        })
    })

    return job
}

export default {
    getReleaseNotes,
    createSchedule
}

export interface IReleaseNote {
    version: string
    content: string
}
