import { resolveEmbed } from '../Utils'

export function validateDAMERule(rawData) {
    if (!rawData) throw new TypeError('"rawData" is required')

    const data = {
        name: '',
        event_type: 1,
        trigger_type: 1,
        trigger_metadata: {},
        actions: [],
        enabled: !!rawData.enabled,
        exempt_roles: [],
        exempt_channels: []
    }

    if (typeof rawData.name === 'string') data.name = rawData.name
    if (typeof rawData.event_type === 'number' && [1, 2].includes(rawData.event_type))
        data.event_type = rawData.event_type
    if (typeof rawData.trigger_type === 'number' && [1, 3, 4, 5, 6].includes(rawData.trigger_type))
        data.trigger_type = rawData.trigger_type
    if (Array.isArray(rawData.exempt_roles) && rawData.exempt_roles.every(v => typeof v === 'string'))
        data.exempt_roles = rawData.exempt_roles
    if (Array.isArray(rawData.exempt_channels) && rawData.exempt_channels.every(v => typeof v === 'string'))
        data.exempt_channels = rawData.exempt_channels

    const rawTriggerMetadata = rawData.trigger_metadata ?? {}

    if (data.trigger_type === 1 || data.trigger_type === 6) {
        if (
            Array.isArray(rawTriggerMetadata.keyword_filter) &&
            rawTriggerMetadata.keyword_filter.every(v => typeof v === 'string')
        )
            data.trigger_metadata.keyword_filter = rawTriggerMetadata.keyword_filter

        if (
            Array.isArray(rawTriggerMetadata.regex_patterns) &&
            rawTriggerMetadata.regex_patterns.every(v => typeof v === 'string')
        )
            data.trigger_metadata.regex_patterns = rawTriggerMetadata.regex_patterns

        if (
            Array.isArray(rawTriggerMetadata.allow_list) &&
            rawTriggerMetadata.allow_list.every(v => typeof v === 'string')
        )
            data.trigger_metadata.allow_list = rawTriggerMetadata.allow_list
    } else if (data.trigger_type === 4) {
        if (Array.isArray(rawTriggerMetadata.presets) && rawTriggerMetadata.presets.every(v => [1, 2, 3].includes(v)))
            data.trigger_metadata.presets = [...new Set(rawTriggerMetadata.presets)]

        if (
            Array.isArray(rawTriggerMetadata.allow_list) &&
            rawTriggerMetadata.allow_list.every(v => typeof v === 'string')
        )
            data.trigger_metadata.allow_list = rawTriggerMetadata.allow_list
    } else if (data.trigger_type === 5) {
        if (
            typeof rawTriggerMetadata.mention_total_limit === 'number' &&
            rawTriggerMetadata.mention_total_limit > 0 &&
            rawTriggerMetadata.mention_total_limit <= 50
        )
            data.trigger_metadata.mention_total_limit = rawTriggerMetadata.mention_total_limit

        data.trigger_metadata.mention_raid_protection_enabled = !!rawTriggerMetadata.mention_raid_protection_enabled
    }

    if (Array.isArray(rawData.actions) && rawData.actions.every(v => typeof v === 'object' && v !== null))
        data.actions = validateDAMERuleActions(data.trigger_type, rawData.actions)

    return data
}

export function validateDAMERuleActions(triggerType, rawActions) {
    const actions = []

    for (const action of rawActions) {
        if (action.type === 1 && triggerType !== 6 && typeof action.metadata?.custom_message === 'string') {
            actions.push({
                type: action.type,
                metadata: { custom_message: action.metadata.custom_message }
            })
        } else if (action.type === 2 && typeof action.metadata?.channel_id === 'string') {
            actions.push({
                type: action.type,
                metadata: { channel_id: action.metadata.channel_id }
            })
        } else if (
            action.type === 3 &&
            (triggerType === 1 || triggerType === 5) &&
            typeof action.metadata?.duration_seconds === 'number'
        ) {
            if (action.metadata.duration_seconds < 60 || action.metadata.duration_seconds > 28 * 24 * 60 * 60)
                action.metadata.duration_seconds = 60

            actions.push({
                type: action.type,
                metadata: {
                    duration_seconds:
                        action.metadata.duration_seconds >= 60 && action.metadata.duration_seconds <= 28 * 24 * 60 * 60
                            ? action.metadata.duration_seconds
                            : 60
                }
            })
        } else if (action.type === 4 && triggerType === 6) {
            actions.push({
                type: action.type,
                metadata: {}
            })
        } else if (action.type === 101 && typeof action.metadata?.duration_seconds === 'number') {
            if (action.metadata.duration_seconds < 0 || action.metadata.duration_seconds > 2 * 365 * 24 * 60 * 60)
                action.metadata.duration_seconds = 0

            actions.push({
                type: action.type,
                metadata: { duration_seconds: action.metadata.duration_seconds }
            })
        } else if (action.type === 102) {
            actions.push({
                type: action.type,
                metadata: {}
            })
        } else if (action.type === 103) {
            actions.push({
                type: action.type,
                metadata: {}
            })
        } else if (action.type === 104) {
            if (
                !Array.isArray(action.metadata?.add_roles) ||
                action.metadata.add_roles.some(v => typeof v !== 'string')
            )
                action.metadata.add_roles = []
            if (
                !Array.isArray(action.metadata?.remove_roles) ||
                action.metadata.remove_roles.some(v => typeof v !== 'string')
            )
                action.metadata.remove_roles = []

            actions.push({
                type: action.type,
                metadata: {
                    add_roles: action.metadata.add_roles,
                    remove_roles: action.metadata.remove_roles
                }
            })
        } else if (action.type === 105) {
            actions.push({
                type: action.type,
                metadata: {
                    message: {
                        content: action.metadata?.message?.content ?? null,
                        embed: resolveEmbed(action.metadata?.message?.embed ?? {})
                    }
                }
            })
        }
    }

    return actions
}
