require('./config.env')

const isMaster = process.env.LCN_SERVER_HOST === 'localhost'
const apps = []

if (isMaster) {
    apps.push(
        {
            name: 'server',
            script: 'npm run start'
        },
        {
            name: 'api',
            script: 'npm run start:api'
        },
        {
            name: 'bot',
            script: 'npm run start:bot'
        }
    )
} else {
    apps.push({
        name: 'bot',
        script: 'npm run start:bot'
    })
}

module.exports = { apps }
