import { ServerModulesAutomation, ServerModulesCustomCommand } from '@lacunahub/lacuna-database-driver'
import { languages } from '@lacunahub/lacuna-locale'
import { Context } from 'koa'
import database from '../../../../database'
import { isObject, parseJSON } from '../../../../internals/utility/Utils'
import APIError from '../../../utility/APIError'
import { FileContent, Repository, TreeFile, getFileContents, getRepository, getRepositoryTree } from '../../../utility/GitHubAPI'

export default async function getPlugin(ctx: Context) {
    const repoOwner: string = ctx.params.repoOwner,
        repoName: string = ctx.params.repoName
    const guildId: string = ctx.query.guildId as string

    if (!guildId) {
        ctx.throw(400, new APIError(1, 'Parameter "guildId" is required'))
    }

    const server = await database.servers.findOne({ _id: guildId, blocked: false })

    if (!server) {
        ctx.throw(404, new APIError(1003))
    }

    const repoFullName = `${repoOwner}/${repoName}`
    let repo: Repository,
        repoTreeFiles: TreeFile[] = [],
        repoFileContents: FileContent[] = []

    const verifiedRepos: string[] = await database.qdb.get('verifiedPluginRepositories')

    if (!verifiedRepos.includes(repoFullName)) {
        ctx.throw(404, new APIError(1009))
    }

    try {
        repo = await getRepository(repoFullName)
        const repoTree = await getRepositoryTree({
            fullName: repo.full_name,
            treeSHA: repo.default_branch,
            recursive: true
        })
        repoTreeFiles = repoTree.tree.filter(v => v.type === 'blob' && ['.json', '.md'].some(vv => v.path.endsWith(vv)))
        repoFileContents = await getFileContents(repoTreeFiles)
    } catch (err) {
        ctx.throw(500, new APIError(1, err.message))
    }

    const manifestFile = repoTreeFiles.find(v => v.path === 'manifest.json'),
        manifestContent = repoFileContents.find(v => v.sha === manifestFile?.sha)

    if (!manifestFile || !manifestContent) {
        ctx.throw(404, new APIError(1, 'Plugin manifest not found'))
    }

    const readmeFile = repoTreeFiles.find(v => v.path === 'README.md'),
        readmeContent = repoFileContents.find(v => v.sha === readmeFile?.sha)

    if (!readmeFile || !readmeContent) {
        ctx.throw(404, new APIError(1, 'Plugin description not found'))
    }

    const manifest = parseJSON(manifestContent.content)
    const readmeFileLocales = repoTreeFiles.filter(v => /README_\w{2}\.md/.test(v.path)),
        readmeContentLocales = readmeFileLocales.map(v => {
            const locale = v.path.match(/README_(\w{2})\.md/)[1],
                content = repoFileContents.find(v => v.sha === v.sha)

            return { locale, content }
        })

    function formatL10ns(val: any) {
        if (!isObject(val)) return {}
        const l10ns: Record<string, string> = {}

        for (const key of Object.keys(val)) {
            const value = val[key]
            if (!languages.some(v => v.code === key)) continue
            if (typeof value !== 'string' || value.length <= 0) continue
            l10ns[key] = value
        }

        return l10ns
    }

    ctx.status = 200
    ctx.body = {
        name: manifest?.name,
        name_l10ns: formatL10ns(manifest?.name_l10ns),
        summary: manifest?.description || manifest?.summary,
        summary_l10ns: formatL10ns(manifest?.summary_l10ns),
        description: readmeContent.content,
        description_l10ns: Object.assign(
            {},
            readmeContentLocales.filter(v => languages.some(vv => v.locale === vv.code)).map(v => ({ [v.locale]: v.content }))
        ),
        version: manifest?.version,
        puzzles: repoTreeFiles
            .filter(v => v.path.startsWith('puzzles/') && repoFileContents.some(vv => vv.sha === v.sha))
            .map(v => {
                const content = repoFileContents.find(vv => vv.sha === v.sha),
                    json: ServerModulesCustomCommand | ServerModulesAutomation = JSON.parse(content.content)

                return {
                    type: 'trigger' in json ? 'AUTOMATION' : 'CUSTOM_COMMAND',
                    data: json
                }
            })
    }
}
