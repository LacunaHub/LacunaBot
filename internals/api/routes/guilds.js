const { Router } = require('express')
const servers = require('../../../database/schemas/Servers')
const authorize = require('../utility/Authorize')
const ShardingManager = require('../../utility/ShardingManager')
const Translator = require('../../locale/Translator')
const Guilds = require('../interfaces/Guilds')

const router = Router()

router.get('/:guild_id/settings', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id

    if (!guild_id) {
        await res.status(400).json('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).json('Guild Not Found')

        return
    }

    const channels = (await ShardingManager.broadcastEval(`this.guilds.cache.get('${guild_id}').channels.cache`)).filter(data => data)[0]
    const roles = (await ShardingManager.broadcastEval(`this.guilds.cache.get('${guild_id}').roles.cache.filter(r => !r.managed)`)).filter(data => data)[0]
    const commands = await ShardingManager.shards.first().eval('this.commands.filter(c => !c.private).map(c => { return { name: c.name, aliases: c.aliases, group: c.group, premium: c.premium_only, permissions: { client: c.self_permissions, author: c.user_permissions } } })')

    const locale = Translator.locale(guild.locale).commands

    await res.status(200).json({
        _id: guild._id,
        locale: guild.locale,
        prefix: guild.prefix,
        premium: guild.server.premium,
        commands: {
            ...guild.commands, list: commands.map(c => { return { ...c, docs: { description: locale[c.name].description } }})
        },
        guild: {
            ...req.headers['x-guild-data'], channels: channels, roles: roles.filter(r => r.id != guild_id)
        },
        moderation: {
            case_log: {
                channel_id: guild.moderation.case_log.channel_id,
                case_types: guild.moderation.case_log.case_types
            },
            logs: {
                types: guild.moderation.logs.types
            },
            warnings: {
                penalties: guild.moderation.warnings.penalties
            },
            roles: {
                mute: guild.moderation.roles.mute
            }
        },
        modules: {
            welcome: guild.modules.welcome,
            farewell: guild.modules.farewell,
            levels: guild.modules.levels,
            voice_manager: guild.modules.voice_manager,
            restoring: {
                restore_roles: guild.modules.restoring.restore_roles,
                restore_nicknames: guild.modules.restoring.restore_nicknames,
                strict_roles: guild.modules.restoring.strict_roles
            },
            music: guild.modules.music
        }
    })
})

router.post('/:guild_id/settings', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const user_id = req.headers['x-user-id']
    const options = req.body

    if (!guild_id) {
        await res.status(400).json('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).json('Guild Not Found')

        return
    }

    const channels = (await ShardingManager.broadcastEval(`this.guilds.cache.get('${guild_id}').channels.cache`)).filter(data => data)[0]
    const roles = (await ShardingManager.broadcastEval(`this.guilds.cache.get('${guild_id}').roles.cache.filter(r => !r.managed)`)).filter(data => data)[0]
    const commands = await ShardingManager.shards.first().eval('this.commands.filter(c => !c.private).map(c => { return { name: c.name, aliases: c.aliases, group: c.group, premium: c.premium_only, permissions: { client: c.self_permissions, author: c.user_permissions } } })')

    const locale = Translator.locale(guild.locale).commands

    const updated = await Guilds.updateSettings(guild, options, user_id)

    await res.status(200).json({
        _id: updated._id,
        locale: updated.locale,
        prefix: updated.prefix,
        premium: updated.server.premium,
        commands: {
            ...updated.commands, list: commands.map(c => { return { ...c, docs: { description: locale[c.name].description } }})
        },
        guild: {
            ...req.headers['x-guild-data'], channels: channels, roles: roles.filter(r => r.id != guild_id)
        },
        moderation: {
            case_log: {
                channel_id: updated.moderation.case_log.channel_id,
                case_types: updated.moderation.case_log.case_types
            },
            logs: {
                types: updated.moderation.logs.types
            },
            warnings: {
                penalties: updated.moderation.warnings.penalties
            },
            roles: {
                mute: updated.moderation.roles.mute
            }
        },
        modules: {
            welcome: updated.modules.welcome,
            farewell: updated.modules.farewell,
            levels: updated.modules.levels,
            voice_manager: updated.modules.voice_manager,
            restoring: {
                restore_roles: updated.modules.restoring.restore_roles,
                restore_nicknames: updated.modules.restoring.restore_nicknames,
                strict_roles: updated.modules.restoring.strict_roles
            },
            music: updated.modules.music
        }
    })
})

module.exports = router