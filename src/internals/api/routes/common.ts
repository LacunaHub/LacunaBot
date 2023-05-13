import Router from '@koa/router'
import { Context } from 'koa'
import database from '../../../database'
import { ICustomCommand } from '../../../database/schemas/Servers'
import { authorize } from '../utility/Authorize'
import { createRateLimitMiddleware } from '../utility/Utils'

const router = new Router({ prefix: '/common' })

router.use(createRateLimitMiddleware(15, 60000))

router.get('/custom-commands/:command_id', authorize, getCustomCommand)
router.get('/custom-commands', authorize, getCustomCommands)
router.post('/custom-commands', authorize, publishCustomCommand)

async function getCustomCommand(ctx: Context) {
    const commandId = ctx.params.command_id as string
    const guildId = ctx.query.guild_id as string

    const command = await database.customCommands.findOne({ _id: commandId, published: true })

    if (!command) ctx.throw(404)

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.server.blocked) ctx.throw(404)

    if (!command.uses.some(i => i.guild_id === guildId)) {
        await database.customCommands.updateOne(
            { _id: commandId },
            {
                $push: {
                    uses: {
                        guild_id: guildId,
                        timestamp: Date.now()
                    }
                },
                $inc: {
                    total_uses: 1
                }
            }
        )
    }

    ctx.status = 200
    ctx.body = {
        _id: command._id,
        data: command.data
    }
}

async function getCustomCommands(ctx: Context) {
    const commands = await database.customCommands.find({ published: true }).sort({ total_uses: -1 })

    ctx.status = 200
    ctx.body = commands.map(i => {
        return {
            _id: i._id,
            name: i.name,
            description: i.description,
            total_uses: i.total_uses,
            uses: i.uses
        }
    })
}

async function publishCustomCommand(ctx: Context) {
    const guildId = ctx.query.guild_id as string,
        userId = ctx.request.headers['user-id'] as string
    const data = ctx.request.body as ICustomCommand

    if (typeof data?.id !== 'string' || typeof data?.command?.name !== 'string' || typeof data?.command?.description !== 'string') ctx.throw(400)

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.server.blocked) ctx.throw(404)

    const command = await database.customCommands.findOne({ _id: data.id })

    if (command) ctx.throw(409)

    await database.customCommands.create({
        _id: data.id,
        author_id: userId,
        guild_id: guildId,
        name: data.command.name,
        description: data.command.description,
        data: JSON.stringify(data)
    })

    ctx.status = 204
}

export default router
