const OAuth2 = require('../discord/OAuth2')

const oauth2 = new OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET)

module.exports = async function(req, res, next) {
    const access_token = req.headers.authorization

    if (access_token && access_token !== 'null') {
        try {
            const user = await oauth2.getUser(access_token)
            
            req.headers['x-user-id'] = user.id
        } catch (err) {
            
        }
    }

    await next()
}