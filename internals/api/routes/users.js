const { Router } = require('express')
const OAuth2 = require('../discord/OAuth2')
const { users } = require('../../../database/DatabaseManager')
const authorize = require('../utility/Authorize')
const { Permissions } = require('discord.js')
const ShardingManager = require('../../utility/ShardingManager')
const { isBotExpert } = require('../interfaces/Guilds')

const router = Router()
const oauth = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

router.get('/@me', authorize, async (req, res) => {
    const user_id = req.headers['x-user-id']

    if (!user_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    const user = await users.find({ _id: user_id })

    if (!user) {
        await res.status(404).json('User Not Found')

        return
    }

    let guilds = null

    try {
        guilds = await oauth.getUserGuilds(req.headers.authorization)
    } catch (err) {
        await res.status(400).send('Bad Request')

        return
    }

    if (!guilds) {
        await res.status(400).send('Bad Request')

        return
    }

    guilds = guilds.filter(g => {
        const permissions = new Permissions(BigInt(g.permissions))

        return g.owner || permissions.has('ADMINISTRATOR')
    })

    for (const guild of guilds) {
        const joined = await ShardingManager.broadcastEval((self, ctx) => {
            return self.guilds.cache.has(ctx.guild.id)
        }, { context: { guild } })

        guild.joined = joined.some(i => i)
    }

    await res.status(200).json({
        user: {
            id: user._id,
            flags: user.flags,
            ...user.user
        },
        guilds: guilds
    })
})

module.exports = router