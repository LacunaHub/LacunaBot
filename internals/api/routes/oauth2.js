const { Router } = require('express')
const OAuth2 = require('../discord/OAuth2')
const { users } = require('../../../database/DatabaseManager')

const router = Router()
const oauth = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

router.get('/', async (req, res) => {
    const data = {
        client_id: oauth.client_id,
        redirect_uri: encodeURIComponent(process.env.REDIRECT_URI),
        scope: encodeURIComponent('identify guilds')
    }

    await res.redirect(`https://discord.com/oauth2/authorize?client_id=${data.client_id}&redirect_uri=${data.redirect_uri}&response_type=code&scope=${data.scope}`)
})

router.get('/callback', async (req, res) => {
    const auth = await oauth.requestToken(req.query.code)
    const user = await oauth.getUser(auth.access_token)

    await res.cookie('access_token', auth.access_token, { maxAge: auth.expires_in * 1000, domain: process.env.WEBSITE_DOMAIN })

    await res.cookie('user_id', user.id, { maxAge: auth.expires_in * 1000, domain: process.env.WEBSITE_DOMAIN })
        .cookie('user_username', user.username, { maxAge: auth.expires_in * 1000, domain: process.env.WEBSITE_DOMAIN })
        .cookie('user_discriminator', user.discriminator, { maxAge: auth.expires_in * 1000, domain: process.env.WEBSITE_DOMAIN })
        
    if (user.avatar) res.cookie('user_avatar', user.avatar, { maxAge: auth.expires_in * 1000, domain: process.env.WEBSITE_DOMAIN })

    const entry = await users.find({ _id: user.id })

    if (!entry) {
        await users.create({
            _id: user.id,
            user: {
                username: user.username,
                discriminator: user.discriminator,
                avatar: user.avatar,
                flags: user.public_flags
            }
        })
    }

    else {
        if (entry.user.avatar !== user.avatar) {
            await users.update({ _id: user.id }, { $set: { 'user.avatar': user.avatar } })
        }

        if (entry.user.discriminator !== user.discriminator) {
            await users.update({ _id: user.id }, { $set: { 'user.discriminator': user.discriminator } })
        }

        if (entry.user.flags !== user.public_flags) {
            await users.update({ _id: user.id }, { $set: { 'user.flags': user.public_flags } })
        }

        if (entry.user.username !== user.username) {
            await users.update({ _id: user.id }, { $set: { 'user.username': user.username } })
        }
    }

    await res.redirect(process.env.WEBSITE_URL)
})

router.get('/add', async (req, res) => {
    const query = new URLSearchParams(req.query).toString()
    await res.redirect(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot%20applications.commands&permissions=844491870&${query}`)
})

module.exports = router