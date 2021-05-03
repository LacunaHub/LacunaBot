const fetch = require('node-fetch')
const logger = require('../../../Logger')

class Channels {
    static get base_url() {
        return 'https://discord.com/api/channels'
    }

    static async createMessage(channel_id, message) {
        const options = {
            method: 'POST',
            url: `${this.base_url}/${channel_id}/messages`,
            headers: {
                Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        }

        const res = await fetch(options.url, options)

        return res.status === 200 ? await res.json() : null
    }

    static async getMessage(channel_id, message_id) {
        const options = {
            method: 'GET',
            url: `${this.base_url}/${channel_id}/messages/${message_id}`,
            headers: {
                Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }

        const res = await fetch(options.url, options)

        return res.status === 200 ? await res.json() : null
    }

    static async createReaction(channel_id, message_id, emoji) {
        const options = {
            method: 'PUT',
            url: `${this.base_url}/${channel_id}/messages/${message_id}/reactions/${encodeURIComponent(emoji)}/@me`,
            headers: {
                Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }

        const res = await fetch(options.url, options)

        return res.status === 204 ? true : false
    }

    static async getReactions(channel_id, message_id, emoji) {
        const options = {
            method: 'GET',
            url: `${this.base_url}/${channel_id}/messages/${message_id}/reactions/${encodeURIComponent(emoji)}`,
            headers: {
                Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }

        const res = await fetch(options.url, options)

        return res.status === 200 ? await res.json() : null
    }

    static async deleteReactionEmoji(channel_id, message_id, emoji) {
        const options = {
            method: 'DELETE',
            url: `${this.base_url}/${channel_id}/messages/${message_id}/reactions/${encodeURIComponent(emoji)}`,
            headers: {
                Authorization: `Bot ${process.env.CLIENT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }

        const res = await fetch(options.url, options)

        return res.status === 204 ? true : false
    }
}

module.exports = Channels