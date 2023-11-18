import Router from '@koa/router'
import { Context } from 'koa'
import database from '../../../database'
import { CustomCommand, IAutomation } from '../../../database/schemas/Servers'
import {
    FileContent,
    Repository,
    SearchRepositoriesResponse,
    TreeFile,
    getFileContents,
    getRepository,
    getRepositoryTree,
    searchRepositories
} from '../../utility/GitHubAPI'
import APIError from '../utility/APIError'
import { authorize } from '../utility/Authorize'
import { createRateLimitMiddleware } from '../utility/Utils'

const router = new Router({ prefix: '/common' })

router.get('/plugins', createRateLimitMiddleware(10), authorize, getPlugins)
router.get('/plugins/:repoOwner/:repoName', createRateLimitMiddleware(10), authorize, getPlugin)

async function getPlugins(ctx: Context) {
    let repoSearch: SearchRepositoriesResponse

    try {
        repoSearch = await searchRepositories({ q: 'topic:lacuna-bot-plugin', sort: 'updated' })
    } catch (err) {
        ctx.throw(500, new APIError(1, err.message))
    }

    const verifiedRepos: string[] = await database.qdb.get('verifiedPluginRepositories')

    ctx.status = 200
    ctx.body = {
        total: repoSearch.total_count,
        data: repoSearch.items
            .filter(v => verifiedRepos.includes(v.full_name))
            .map(v => {
                return {
                    name: v.name,
                    full_name: v.full_name,
                    owner_login: v.owner.login,
                    owner_avatar_url: v.owner.avatar_url,
                    description: v.description,
                    created_at: new Date(v.created_at).getTime(),
                    updated_at: new Date(v.updated_at).getTime(),
                    pushed_at: new Date(v.pushed_at).getTime(),
                    stargazers_count: v.stargazers_count
                }
            })
    }
}

async function getPlugin(ctx: Context) {
    const repoOwner: string = ctx.params.repoOwner,
        repoName: string = ctx.params.repoName
    const guildId: string = ctx.query.guildId as string

    if (!guildId) {
        ctx.throw(400, new APIError(1, 'Parameter "guildId" is required'))
    }

    const server = await database.servers.findOne({ _id: guildId, 'server.blocked': false })

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
        const repoTree = await getRepositoryTree({ fullName: repo.full_name, treeSHA: repo.default_branch, recursive: true })
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

    ctx.status = 200
    ctx.body = {
        manifest: JSON.parse(manifestContent.content),
        description: readmeContent.content,
        puzzles: repoTreeFiles
            .filter(v => v.path.startsWith('puzzles/') && repoFileContents.some(vv => vv.sha === v.sha))
            .map(v => {
                const content = repoFileContents.find(vv => vv.sha === v.sha),
                    json: CustomCommand | IAutomation = JSON.parse(content.content)

                return {
                    type: 'trigger' in json ? 'AUTOMATION' : 'CUSTOM_COMMAND',
                    data: json
                }
            })
    }
}

export default router
