import { randomUUID } from 'crypto'
import {
    APIApplicationRoleConnection,
    OAuth2Scopes,
    RESTAPIPartialCurrentUserGuild,
    RESTGetAPICurrentUserResult,
    RESTGetAPIOAuth2CurrentAuthorizationResult,
    RESTPostOAuth2AccessTokenResult,
    RESTPostOAuth2RefreshTokenResult
} from 'discord.js'

export class DiscordOAuth2 {
    public clientId: string
    public clientSecret: string
    public redirectUri: string
    public baseAuthorizationURL: string
    public tokenURL: string
    public tokeRevocationURL: string

    constructor(clientId: string, clientSecret: string) {
        this.clientId = clientId

        this.clientSecret = clientSecret

        this.redirectUri = `${process.env.LCN_API_URL}/authorize/callback`

        this.baseAuthorizationURL = 'https://discord.com/api/oauth2/authorize'

        this.tokenURL = 'https://discord.com/api/oauth2/token'

        this.tokeRevocationURL = 'https://discord.com/api/oauth2/token/revoke'
    }

    getOAuthURL(scope: OAuth2Scopes[], redirectUri = this.redirectUri) {
        const url = new URL(this.baseAuthorizationURL),
            state = randomUUID()

        url.searchParams.set('client_id', this.clientId)
        url.searchParams.set('redirect_uri', redirectUri)
        url.searchParams.set('response_type', 'code')
        url.searchParams.set('state', state)
        url.searchParams.set('scope', scope.join(' '))
        url.searchParams.set('prompt', 'none')

        return { url, state }
    }

    async exchangeCode(code: string, redirectUri = this.redirectUri): Promise<RESTPostOAuth2AccessTokenResult> {
        const searchParams = new URLSearchParams()

        searchParams.append('client_id', this.clientId)
        searchParams.append('client_secret', this.clientSecret)
        searchParams.append('code', code)
        searchParams.append('redirect_uri', redirectUri)
        searchParams.append('grant_type', 'authorization_code')

        try {
            const response = await fetch(this.tokenURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: searchParams
            })

            if (!response.ok) {
                throw new Error(`(${response.status} ${response.statusText}) Failed to exchange code`)
            }

            return await response.json()
        } catch (err) {
            throw new Error(err)
        }
    }

    async refreshToken(refreshToken: string): Promise<RESTPostOAuth2RefreshTokenResult> {
        const searchParams = new URLSearchParams()

        searchParams.append('client_id', this.clientId)
        searchParams.append('client_secret', this.clientSecret)
        searchParams.append('grant_type', 'refresh_token')
        searchParams.append('refresh_token', refreshToken)

        try {
            const response = await fetch(this.tokenURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: searchParams
            })

            if (!response.ok) {
                throw new Error(`(${response.status} ${response.statusText}) Failed to refresh token`)
            }

            return await response.json()
        } catch (err) {
            throw new Error(err)
        }
    }

    async getUser(accessToken: string): Promise<RESTGetAPICurrentUserResult> {
        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            if (!response.ok) {
                throw new Error(`(${response.status} ${response.statusText}) Failed to get user`)
            }

            return await response.json()
        } catch (err) {
            throw new Error(err)
        }
    }

    async getUserAuthorization(accessToken: string): Promise<RESTGetAPIOAuth2CurrentAuthorizationResult> {
        try {
            const response = await fetch('https://discord.com/api/oauth2/@me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            })

            if (!response.ok) {
                throw new Error(`(${response.status} ${response.statusText}) Failed to get user authorization`)
            }

            return await response.json()
        } catch (err) {
            throw new Error(err)
        }
    }

    async getUserGuilds(accessToken: string): Promise<RESTAPIPartialCurrentUserGuild[]> {
        try {
            const response = await fetch('https://discord.com/api/users/@me/guilds', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`(${response.status} ${response.statusText}) Failed to get user guilds`)
            }

            return await response.json()
        } catch (err) {
            throw new Error(err)
        }
    }

    async updateUserRoleConnection(
        accessToken: string,
        roleConnection: Partial<APIApplicationRoleConnection>
    ): Promise<APIApplicationRoleConnection> {
        try {
            const response = await fetch(`https://discord.com/api/users/@me/applications/${this.clientId}/role-connection`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(roleConnection)
            })

            if (!response.ok) {
                throw new Error(`(${response.status} ${response.statusText}) Failed to update user role connection`)
            }

            return await response.json()
        } catch (err) {
            throw new Error(err)
        }
    }
}

export const oauth2 = new DiscordOAuth2(process.env.LCN_DISCORD_CLIENT_ID, process.env.LCN_DISCORD_CLIENT_SECRET)
