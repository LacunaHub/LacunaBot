import { Context } from 'vm'
import database from '../../../../database'
import APIError from '../../../utility/APIError'
import { SearchRepositoriesResponse, searchRepositories } from '../../../utility/GitHubAPI'

export default async function getPlugins(ctx: Context) {
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
