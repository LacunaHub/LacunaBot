const fetch = require('node-fetch')

class Webhooks {
    static get base_url() {
        return 'https://discord.com/api/webhooks'
    }

    static async deleteWebhook(id) {
        const options = {
            method: 'DELETE',
            url: `${this.base_url}/${id}`,
            headers: {
                Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }

        const res = await fetch(options.url, options)

        return res.status === 200 ? await res.json() : null
    }
}

module.exports = Webhooks