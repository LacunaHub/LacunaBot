require('./config.env')

const isMaster = process.env.LCN_SERVER_HOST === 'localhost'
const apps = []

if (isMaster) {
    apps.push(
        {
            name: 'server',
            script: './process.npm.js',
            args: 'run start'
        },
        {
            name: 'api',
            script: './process.npm.js',
            args: 'run start:api'
        },
        {
            name: 'bot',
            script: './process.npm.js',
            args: 'run start:bot'
        }
    )
} else {
    apps.push({
        name: 'bot',
        script: './process.npm.js',
        args: 'run start:bot'
    })
}

module.exports = { apps }
