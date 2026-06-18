export async function searchRepositories(options: SearchRepositoriesOptions): Promise<SearchRepositoriesResponse> {
    if (!options.q) throw new TypeError('Query parameter "q" is required')

    const searchParams = new URLSearchParams(options as any).toString()

    try {
        const response = await fetch(`https://api.github.com/search/repositories?${searchParams}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.LCN_GITHUB_PERSONAL_ACCESS_TOKEN}`
            }
        })

        if (response.ok) {
            return await response.json()
        }

        throw new Error(`Failed to search repositories with status code ${response.status}`)
    } catch (err) {
        throw new Error(err as any)
    }
}

export async function getRepository(fullName: string): Promise<Repository> {
    if (!fullName) throw new TypeError('Argument "fullName" is required')

    const [owner, repo] = fullName.split('/')

    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.LCN_GITHUB_PERSONAL_ACCESS_TOKEN}`
            }
        })

        if (response.ok) {
            return await response.json()
        }

        throw new Error(`Failed to get repository with status code ${response.status}`)
    } catch (err) {
        throw new Error(err as any)
    }
}

export async function getRepositoryTree(options: GetRepositoryTreeOptions): Promise<RepositoryTree> {
    if (!options.fullName) throw new TypeError('Parameter "fullName" is required')
    if (!options.treeSHA) throw new TypeError('Parameter "treeSHA" is required')

    const [owner, repo] = options.fullName.split('/')

    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/git/trees/${options.treeSHA}?recursive=${!!options.recursive}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.LCN_GITHUB_PERSONAL_ACCESS_TOKEN}`
                }
            }
        )

        if (response.ok) {
            return await response.json()
        }

        throw new Error(`Failed to get repository tree with status code ${response.status}`)
    } catch (err) {
        throw new Error(err as any)
    }
}

export async function getFileContent(file: TreeFile): Promise<FileContent> {
    if (!file.url) throw new TypeError('Parameter "url" is required')

    try {
        const response = await fetch(file.url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.LCN_GITHUB_PERSONAL_ACCESS_TOKEN}`
            }
        })

        if (response.ok) {
            return await response.json()
        }

        throw new Error(`Failed to get file content with status code ${response.status}`)
    } catch (err) {
        throw new Error(err as any)
    }
}

export async function getFileContents(files: TreeFile[]): Promise<FileContent[]> {
    const contents: FileContent[] = []

    for (const file of files) {
        try {
            const content = await getFileContent(file)
            content.content = Buffer.from(content.content, 'base64').toString()

            contents.push(content)
        } catch (err) {
            throw new Error(err as any)
        }
    }

    return contents
}

export interface SearchRepositoriesOptions {
    q: string
    sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated'
    order?: 'asc' | 'desc'
    per_page?: number
    page?: number
}

export interface SearchRepositoriesResponse {
    total_count: number
    incomplete_results: boolean
    items: SearchRepository[]
}

export interface SearchRepository {
    id: number
    node_id: string
    name: string
    full_name: string
    owner: RepositoryOwner
    private: boolean
    html_url: string
    description: string
    fork: boolean
    url: string
    created_at: string
    updated_at: string
    pushed_at: string
    homepage: string
    size: number
    stargazers_count: number
    watchers_count: number
    language: string
    forks_count: number
    open_issues_count: number
    master_branch: string
    default_branch: string
    score: number
    archive_url: string
    assignees_url: string
    blobs_url: string
    branches_url: string
    collaborators_url: string
    comments_url: string
    commits_url: string
    compare_url: string
    contents_url: string
    contributors_url: string
    deployments_url: string
    downloads_url: string
    events_url: string
    forks_url: string
    git_commits_url: string
    git_refs_url: string
    git_tags_url: string
    git_url: string
    issue_comment_url: string
    issue_events_url: string
    issues_url: string
    keys_url: string
    labels_url: string
    languages_url: string
    merges_url: string
    milestones_url: string
    notifications_url: string
    pulls_url: string
    releases_url: string
    ssh_url: string
    stargazers_url: string
    statuses_url: string
    subscribers_url: string
    subscription_url: string
    tags_url: string
    teams_url: string
    trees_url: string
    clone_url: string
    mirror_url: string
    hooks_url: string
    svn_url: string
    forks: number
    open_issues: number
    watchers: number
    has_issues: boolean
    has_projects: boolean
    has_pages: boolean
    has_wiki: boolean
    has_downloads: boolean
    archived: boolean
    disabled: boolean
    visibility: string
    license: RepositoryLicense
}

export interface RepositoryOwner {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string
    url: string
    received_events_url: string
    type: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    site_admin: boolean
}

export interface RepositoryLicense {
    key: string
    name: string
    url: string
    spdx_id: string
    node_id: string
    html_url: string
}

export interface Repository {
    id: number
    node_id: string
    name: string
    full_name: string
    owner: RepositoryOwner
    private: boolean
    html_url: string
    description: string
    fork: boolean
    url: string
    archive_url: string
    assignees_url: string
    blobs_url: string
    branches_url: string
    collaborators_url: string
    comments_url: string
    commits_url: string
    compare_url: string
    contents_url: string
    contributors_url: string
    deployments_url: string
    downloads_url: string
    events_url: string
    forks_url: string
    git_commits_url: string
    git_refs_url: string
    git_tags_url: string
    git_url: string
    issue_comment_url: string
    issue_events_url: string
    issues_url: string
    keys_url: string
    labels_url: string
    languages_url: string
    merges_url: string
    milestones_url: string
    notifications_url: string
    pulls_url: string
    releases_url: string
    ssh_url: string
    stargazers_url: string
    statuses_url: string
    subscribers_url: string
    subscription_url: string
    tags_url: string
    teams_url: string
    trees_url: string
    clone_url: string
    mirror_url: string
    hooks_url: string
    svn_url: string
    homepage: string
    language: null
    forks_count: number
    forks: number
    stargazers_count: number
    watchers_count: number
    watchers: number
    size: number
    default_branch: string
    open_issues_count: number
    open_issues: number
    is_template: boolean
    topics: string[]
    has_issues: boolean
    has_projects: boolean
    has_wiki: boolean
    has_pages: boolean
    has_downloads: boolean
    has_discussions: boolean
    archived: boolean
    disabled: boolean
    visibility: string
    pushed_at: string
    created_at: string
    updated_at: string
    permissions: RepositoryPermissions
    allow_rebase_merge: boolean
    template_repository: RepositoryParent
    temp_clone_token: string
    allow_squash_merge: boolean
    allow_auto_merge: boolean
    delete_branch_on_merge: boolean
    allow_merge_commit: boolean
    subscribers_count: number
    network_count: number
    license: RepositoryLicense
    organization: RepositoryOwner
    parent: RepositoryParent
    source: RepositoryParent
}

export interface RepositoryParent {
    id: number
    node_id: string
    name: string
    full_name: string
    owner: RepositoryOwner
    private: boolean
    html_url: string
    description: string
    fork: boolean
    url: string
    archive_url: string
    assignees_url: string
    blobs_url: string
    branches_url: string
    collaborators_url: string
    comments_url: string
    commits_url: string
    compare_url: string
    contents_url: string
    contributors_url: string
    deployments_url: string
    downloads_url: string
    events_url: string
    forks_url: string
    git_commits_url: string
    git_refs_url: string
    git_tags_url: string
    git_url: string
    issue_comment_url: string
    issue_events_url: string
    issues_url: string
    keys_url: string
    labels_url: string
    languages_url: string
    merges_url: string
    milestones_url: string
    notifications_url: string
    pulls_url: string
    releases_url: string
    ssh_url: string
    stargazers_url: string
    statuses_url: string
    subscribers_url: string
    subscription_url: string
    tags_url: string
    teams_url: string
    trees_url: string
    clone_url: string
    mirror_url: string
    hooks_url: string
    svn_url: string
    homepage: string
    language: null
    forks_count: number
    stargazers_count: number
    watchers_count: number
    size: number
    default_branch: string
    open_issues_count: number
    is_template: boolean
    topics: string[]
    has_issues: boolean
    has_projects: boolean
    has_wiki: boolean
    has_pages: boolean
    has_downloads: boolean
    archived: boolean
    disabled: boolean
    visibility: string
    pushed_at: string
    created_at: string
    updated_at: string
    permissions: RepositoryPermissions
    allow_rebase_merge: boolean
    temp_clone_token: string
    allow_squash_merge: boolean
    allow_auto_merge: boolean
    delete_branch_on_merge: boolean
    allow_merge_commit: boolean
    subscribers_count: number
    network_count: number
    license: RepositoryLicense
    forks: number
    open_issues: number
    watchers: number
    security_and_analysis?: RepositorySecurityAndAnalysis
}

export interface RepositoryPermissions {
    pull: boolean
    push: boolean
    admin: boolean
}

export interface RepositorySecurityAndAnalysis {
    advanced_security: SecurityAndAnalysisConfig
    secret_scanning: SecurityAndAnalysisConfig
    secret_scanning_push_protection: SecurityAndAnalysisConfig
}

export interface SecurityAndAnalysisConfig {
    status: string
}

export interface GetRepositoryTreeOptions {
    fullName: string
    treeSHA: string
    recursive?: boolean
}

export interface RepositoryTree {
    sha: string
    url: string
    tree: TreeFile[]
    truncated: boolean
}

export interface TreeFile {
    path: string
    mode: string
    type: string
    size?: number
    sha: string
    url: string
}

export interface FileContent {
    content: string
    encoding: string
    url: string
    sha: string
    size: number
    node_id: string
}
