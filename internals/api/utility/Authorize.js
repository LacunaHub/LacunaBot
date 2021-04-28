const { Permissions } = require('discord.js')
const OAuth2 = require('../discord/OAuth2')
const ShardingManager = require('../../utility/ShardingManager')

const oauth2 = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

module.exports = async function(req, res, next) {
    const access_token = req.headers.authorization

    if (!access_token || access_token === 'null') {
        await res.status(401).send('Unauthorized')

        return
    }

    let user
    
    try {
        user = await oauth2.getUser(access_token)
    } catch (err) {
        await res.status(403).send('Forbidden')

        return
    }

    req.headers['x-user-id'] = user.id

    await next()
}

module.exports.permitted = async function (req, res, next) {
    const access_token = req.headers.authorization
    const guild_id = req.params.guild_id
    const user_id = req.headers['x-user-id']

    if (!access_token || access_token === 'null') {
        await res.status(401).send('Unauthorized')

        return
    }

    if (!guild_id) {
        await res.status(400).json('Invalid Form')

        return
    }

    let guilds
    
    try {
        guilds = await oauth2.getUserGuilds(access_token)
    } catch (err) {
        await res.status(403).send('Forbidden')

        return
    }

    const guild = guilds.find(g => g.id == guild_id)

    if (!guild) {
        await res.status(404).send('Not Found')

        return
    }

    const permissions = new Permissions(guild.permissions)
    const owner = await ShardingManager.shards.first().eval(`this.application.owner.members.some(m => m.id == ${user_id})`)

    if (!guild.owner && !permissions.has('ADMINISTRATOR') && !owner) {
        await res.status(403).send('Forbidden')

        return
    }

    req.headers['x-guild-data'] = guild

    await next()
}