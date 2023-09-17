import Router from '@koa/router'
import { APIUser } from 'discord.js'
import { Context } from 'koa'
import database from '../../../database'
import { IAutomation, ICustomCommand } from '../../../database/schemas/Servers'
import APIError from '../utility/APIError'
import { authorize } from '../utility/Authorize'
import { createRateLimitMiddleware } from '../utility/Utils'

const router = new Router({ prefix: '/common' })

router.get('/automation-tasks/:automation_id', createRateLimitMiddleware(10), authorize, getAutomationTask)
router.get('/automation-tasks', createRateLimitMiddleware(10), authorize, getAutomationTasks)
router.post('/automation-tasks', createRateLimitMiddleware(5), authorize, publishAutomationTask)
router.get('/custom-commands/:command_id', createRateLimitMiddleware(10), authorize, getCustomCommand)
router.get('/custom-commands', createRateLimitMiddleware(10), authorize, getCustomCommands)
router.post('/custom-commands', createRateLimitMiddleware(5), authorize, publishCustomCommand)

async function getAutomationTask(ctx: Context) {
    const automationId: string = ctx.params.automation_id
    const guildId: string = ctx.query.guild_id as string

    const automation = await database.automationTasks.findOne({ _id: automationId, published: true })

    if (!automation) {
        ctx.throw(404, new APIError(1010))
    }

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    if (!automation.uses.some(i => i.guild_id === guildId)) {
        await database.automationTasks.updateOne(
            { _id: automationId },
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
        _id: automation._id,
        data: automation.data
    }
}

async function getAutomationTasks(ctx: Context) {
    const automationTasks = await database.automationTasks.find({ published: true }).sort({ total_uses: -1 })

    ctx.status = 200
    ctx.body = automationTasks.map(i => {
        return {
            _id: i._id,
            name: i.name,
            total_uses: i.total_uses,
            uses: i.uses
        }
    })
}

async function publishAutomationTask(ctx: Context) {
    const guildId = ctx.query.guild_id as string,
        currentUser: Partial<APIUser> = ctx.state.user
    const data = ctx.request.body as IAutomation

    if (typeof data?.id !== 'string' || typeof data?.name !== 'string' || typeof data?.trigger !== 'string' || !data?.components?.length) {
        ctx.throw(400, new APIError(4010))
    }

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    const automation = await database.automationTasks.findOne({ _id: data.id, guild_id: guildId })

    if (automation) {
        ctx.throw(409, new APIError(2002))
    }

    await database.automationTasks.create({
        _id: data.id,
        author_id: currentUser.id,
        guild_id: guildId,
        name: data.name,
        data: JSON.stringify(data)
    })

    ctx.status = 204
}

async function getCustomCommand(ctx: Context) {
    const commandId = ctx.params.command_id as string
    const guildId = ctx.query.guild_id as string

    const command = await database.customCommands.findOne({ _id: commandId, published: true })

    if (!command) {
        ctx.throw(404, new APIError(1011))
    }

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

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
        currentUser: Partial<APIUser> = ctx.state.user
    const data = ctx.request.body as ICustomCommand

    if (typeof data?.id !== 'string' || typeof data?.command?.name !== 'string' || typeof data?.command?.description !== 'string') {
        ctx.throw(400, new APIError(4011))
    }

    const server = await database.servers.findOne({ _id: guildId })

    if (!server || server.server.blocked) {
        ctx.throw(404, new APIError(1003))
    }

    const command = await database.customCommands.findOne({ _id: data.id })

    if (command) {
        ctx.throw(409, new APIError(2003))
    }

    await database.customCommands.create({
        _id: data.id,
        author_id: currentUser.id,
        guild_id: guildId,
        name: data.command.name,
        description: data.command.description,
        data: JSON.stringify(data)
    })

    ctx.status = 204
}

export default router
