const { Router } = require('express')
const servers = require('../../../database/schemas/Servers')
const users = require('../../../database/schemas/Users')
const authorize = require('../utility/Authorize')
const ShardingManager = require('../../utility/ShardingManager')
const Translator = require('../../locale/Translator')
const Guilds = require('../interfaces/Guilds')
const Twitch = require('../../../modules/Twitch')
const YouTube = require('../../../modules/YouTube')
const qdb = require('quick.db')
const { resolveObjectPath } = require('../../utility/Utils')
const QiwiBill = require('../../structures/QiwiBill')

const router = Router()

router.get('/:guild_id/settings', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id

    if (!guild_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    if (!ShardingManager.shards.every(shard => shard.ready)) {
        await res.status(503).send('Service Unavailable')

        return
    }

    const data = (await ShardingManager.broadcastEval(
        (self, ctx) => {
            const guild = self.guilds.cache.get(ctx.guild_id)
            const channels = guild?.channels?.cache?.sort((a, b) => a.parentId - b.parentId || a.position - b.position)
            const roles = guild?.roles?.cache?.filter(r => !r.managed)?.sort((a, b) => b.rawPosition - a.rawPosition)?.map(r => {
                return { ...r, higher: !r.editable, guild: null }
            })
            const emojis = self.emojis.cache.filter(e => e.guild.id == ctx.guild_id)
            const permissions = guild?.me?.permissions?.toArray()
            return guild ? Object.assign({}, { channels, roles, emojis, permissions }) : null
        }, { context: { guild_id } })
    ).filter(data => data)[0]

    const locale = Translator.locale(guild.locale)

    const commands = qdb.get('commands').map(c => { return { ...c, description: resolveObjectPath(c.description, locale), options: [] } })

    delete require.cache[require.resolve('../../../database/prices.json')]
    const prices = require('../../../database/prices.json')

    await res.status(200).json({
        _id: guild._id,
        locale: guild.locale,
        prefix: guild.prefix,
        premium: guild.server.premium,
        commands: {
            ...guild.commands, list: commands
        },
        guild: {
            ...req.headers['x-guild-data'],
            channels: data.channels,
            roles: data.roles.filter(r => r.id != guild_id),
            emojis: data.emojis,
            permissions: data.permissions
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
                mute: guild.moderation.roles.mute,
                on_mute: {
                    remove_all_roles: guild.moderation.roles.on_mute.remove_all_roles,
                    strict_roles: guild.moderation.roles.on_mute.strict_roles
                }
            },
            automoder: guild.moderation.automoder
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
            reports: guild.modules.reports,
            music: guild.modules.music,
            reactions: guild.modules.reactions,
            twitch: {
                channels: guild.modules.twitch.channels
            },
            youtube: {
                channels: guild.modules.youtube.channels
            },
            autoreactions: guild.modules.autoreactions
        },
        prices
    })
})

router.post('/:guild_id/settings', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const user_id = req.headers['x-user-id']
    const options = req.body

    if (!guild_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const data = (await ShardingManager.broadcastEval(
        (self, ctx) => {
            const guild = self.guilds.cache.get(ctx.guild_id)
            const channels = guild?.channels?.cache?.sort((a, b) => a.parentId - b.parentId || a.position - b.position)
            const roles = guild?.roles?.cache?.filter(r => !r.managed)?.sort((a, b) => b.rawPosition - a.rawPosition)?.map(r => {
                return { ...r, higher: !r.editable, guild: null }
            })
            const emojis = self.emojis.cache.filter(e => e.guild.id == ctx.guild_id)
            const permissions = guild?.me?.permissions?.toArray()
            return guild ? Object.assign({}, { channels, roles, emojis, permissions }) : null
        }, { context: { guild_id } })
    ).filter(data => data)[0]

    const locale = Translator.locale(guild.locale)
    
    const commands = qdb.get('commands').map(c => { return { ...c, description: resolveObjectPath(c.description, locale), options: [] } })

    delete require.cache[require.resolve('../../../database/prices.json')]
    const prices = require('../../../database/prices.json')

    const updated = await Guilds.updateSettings(guild, options, user_id)

    await res.status(200).json({
        _id: updated._id,
        locale: updated.locale,
        prefix: updated.prefix,
        premium: updated.server.premium,
        commands: {
            ...updated.commands, list: commands
        },
        guild: {
            ...req.headers['x-guild-data'],
            channels: data.channels,
            roles: data.roles.filter(r => r.id != guild_id),
            emojis: data.emojis,
            permissions: data.permissions
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
                mute: updated.moderation.roles.mute,
                on_mute: {
                    remove_all_roles: updated.moderation.roles.on_mute.remove_all_roles,
                    strict_roles: updated.moderation.roles.on_mute.strict_roles
                }
            },
            automoder: updated.moderation.automoder
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
            reports: updated.modules.reports,
            music: updated.modules.music,
            reactions: updated.modules.reactions,
            twitch: {
                channels: updated.modules.twitch.channels
            },
            youtube: {
                channels: updated.modules.youtube.channels
            },
            autoreactions: updated.modules.autoreactions
        },
        prices
    })
})

router.post('/:guild_id/get-pay-url', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const user_id = req.headers['x-user-id']
    const amount = Number(req.query.amount)

    if (!guild_id || !user_id || (!amount || isNaN(amount))) {
        await res.status(400).send('Bad request')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).end()

        return
    }

    /**
     * @type {import('../../Typings').UserDocument}
     */
    const user = await users.findOne({ _id: user_id }).lean()

    if (!user) {
        await res.status(404).end()

        return
    }

    if (user.bills.filter(bill => (Date.now() - bill.creation_timestamp) < 600000).length >= 2) {
        await res.status(425).end()

        return
    }

    const data = {
        amount: {
            currency: 'RUB',
            value: amount
        },
        custom_fields: {
            type: 'GUILD',
            reference_id: guild_id,
            user_id: user_id
        }
    }

    const bill = new QiwiBill(data)
    const form = await bill.create()

    if (!form || !form.payUrl) {
        await res.status(400).send('No pay url')

        return
    }

    await res.status(200).send(`${form.payUrl}&successUrl=${encodeURIComponent(`${process.env.WEBSITE_URL}/guilds/${guild_id}/settings`)}`)
})

router.put('/:guild_id/reactions', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const options = req.body

    if (!guild_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.addReactionElement(guild, options)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(200).json(result)
})

router.patch('/:guild_id/reactions', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const options = req.body

    if (!guild_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.editReactionElement(guild, options)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(200).json(result)
})

router.delete('/:guild_id/reactions/:reaction_id', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const reaction_id = req.params.reaction_id

    if (!guild_id || !reaction_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.removeReactionElement(guild, reaction_id)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(204).end()
})

router.get('/:guild_id/twitch/search', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const query = req.query.q

    if (!guild_id || !query) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const channels = await Twitch.searchChannels(query)

    if (!channels || !channels.length) {
        await res.status(404).send('Twitch Channels Not Found')

        return
    }

    const added = guild.modules.twitch.channels

    await res.status(200).json(channels.filter(channel => !added.some(c => c.channel.id == channel.id)))
})

router.put('/:guild_id/twitch', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const options = req.body

    if (!guild_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.addTwitchChannel(guild, options)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(200).json(result)
})

router.patch('/:guild_id/twitch', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const options = req.body

    if (!guild_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.editTwitchChannel(guild, options)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(200).json(result)
})

router.delete('/:guild_id/twitch/:channel_id', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const channel_id = req.params.channel_id

    if (!guild_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.removeTwitchChannel(guild, channel_id)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(204).end()
})

router.get('/:guild_id/youtube/search', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const query = req.query.q

    if (!guild_id || !query) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const channels = await YouTube.searchChannels(query)

    const added = guild.modules.youtube.channels

    await res.status(200).json(channels.filter(channel => !added.some(c => c.channel.id == channel.id)))
})

router.put('/:guild_id/youtube', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const options = req.body

    if (!guild_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.addYouTubeChannel(guild, options)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(200).json(result)
})

router.patch('/:guild_id/youtube', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const options = req.body

    if (!guild_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.editYouTubeChannel(guild, options)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(200).json(result)
})

router.delete('/:guild_id/youtube/:channel_id', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const channel_id = req.params.channel_id

    if (!guild_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.removeYouTubeChannel(guild, channel_id)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(204).end()
})

router.put('/:guild_id/voice-triggers', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const options = req.body

    if (!guild_id || !options) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.addVoiceTrigger(guild, options)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(200).json(result)
})

router.patch('/:guild_id/voice-triggers', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const options = req.body

    if (!guild_id || !options) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.editVoiceTrigger(guild, options)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(200).json(result)
})

router.delete('/:guild_id/voice-triggers/:channel_id', authorize, authorize.permitted, async (req, res) => {
    const guild_id = req.params.guild_id
    const channel_id = req.params.channel_id

    if (!guild_id || !channel_id) {
        await res.status(400).send('Invalid Form')

        return
    }

    /**
     * @type {import('../../Typings').ServerDocument}
     */
    const guild = await servers.findOne({ _id: guild_id }).lean()

    if (!guild || guild.server.blocked) {
        await res.status(404).send('Guild Not Found')

        return
    }

    const result = await Guilds.removeVoiceTrigger(guild, channel_id)

    if (typeof result === 'string') {
        await res.status(400).send(result)

        return
    }

    await res.status(204).end()
})

module.exports = router