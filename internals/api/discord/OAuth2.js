const fetch = require('node-fetch')
const { URLSearchParams } = require('url')

class OAuth2 {
    constructor(client_id, client_secret) {
        this.client_id = client_id

        this.client_secret = client_secret

        this.redirect_uri = process.env.REDIRECT_URI

        this.authorize_url = 'https://discord.com/api/oauth2/authorize'

        this.get_token_url = 'https://discord.com/api/oauth2/token'

        this.revoke_token_url = 'https://discord.com/api/oauth2/token/revoke'
    }

    async requestToken(code) {
        const payload = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.redirect_uri,
            scope: 'identify guilds'
        }

        const options = {
            method: 'POST',
            url: this.get_token_url,
            headers: {
                Authorization: `Basic ${Buffer.from(`${this.client_id}:${this.client_secret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(payload)
        }

        const res = await fetch(options.url, options)

        return res.json()
    }

    async getUser(access_token) {
        const options = {
            method: 'GET',
            url: 'https://discord.com/api/users/@me',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        }

        const res = await fetch(options.url, options)

        return res.json()
    }

    async getUserGuilds(access_token) {
        const options = {
            method: 'GET',
            url: 'https://discord.com/api/users/@me/guilds',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        }

        const res = await fetch(options.url, options)

        return res.json()
    }
}

module.exports = OAuth2