import fetch from 'node-fetch'
import { URLSearchParams } from 'url'

export default class OAuth2 {
    public client_id: string
    public client_secret: string
    public redirect_uri: string
    public authorize_url: string
    public get_token_url: string
    public revoke_token_url: string

    constructor(client_id: string, client_secret: string) {
        this.client_id = client_id

        this.client_secret = client_secret

        this.redirect_uri = process.env.REDIRECT_URI

        this.authorize_url = 'https://discord.com/api/oauth2/authorize'

        this.get_token_url = 'https://discord.com/api/oauth2/token'

        this.revoke_token_url = 'https://discord.com/api/oauth2/token/revoke'
    }

    async requestToken(code: string) {
        const payload = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.redirect_uri,
            scope: 'identify guilds'
        }

        const res = await fetch(this.get_token_url, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${this.client_id}:${this.client_secret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(payload)
        })

        return await res.json()
    }

    async getUser(access_token: string) {
        const res = await fetch('https://discord.com/api/users/@me', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        })

        return await res.json()
    }

    async getUserGuilds(access_token: string) {
        const options = {
            method: 'GET',
            url: 'https://discord.com/api/users/@me/guilds',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        }

        const res = await fetch('https://discord.com/api/users/@me/guilds', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        })

        return await res.json()
    }
}