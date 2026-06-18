import { validateCustomBehaviorComponents } from './ValidateCustomBehaviorComponents'
import { convertComponentsToScript, validateCustomBehaviorScripts } from './ValidateCustomBehaviorScripts'

export function validateCustomCommand(rawData, convertComponents = false) {
    if (!rawData) throw new TypeError('"rawData" is required')

    const data = {
        options: [],
        command: {
            type: 1,
            name: '',
            description: null,
            options: []
        }
    }

    if (Array.isArray(rawData.options)) {
        if (rawData.options.includes('THROTTLING')) {
            data.options.push('THROTTLING')

            data.throttling = {
                type: 'PER_USER',
                max_uses: 1,
                timeout: 60
            }

            if (
                typeof rawData.throttling?.type === 'string' &&
                ['PER_USER', 'PER_CHANNEL', 'PER_GUILD'].includes(rawData.throttling.type)
            )
                data.throttling.type = rawData.throttling.type
            if (
                typeof rawData.throttling?.max_uses === 'number' &&
                rawData.throttling.max_uses >= 1 &&
                rawData.throttling.max_uses <= 10
            )
                data.throttling.max_uses = rawData.throttling.max_uses
            if (
                typeof rawData.throttling?.timeout === 'number' &&
                [60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400].includes(
                    rawData.throttling.timeout
                )
            )
                data.throttling.timeout = rawData.throttling.timeout
        }
    }

    if (typeof rawData.command?.name === 'string') data.command.name = rawData.command.name
    if (typeof rawData.command?.description === 'string')
        data.command.description = rawData.command.description.slice(0, 100)

    if (Array.isArray(rawData.command?.options)) {
        for (const option of rawData.command.options.slice(0, 25)) {
            const opt = {
                type: 3,
                name: 'argument',
                description: 'Argument Description',
                required: Boolean(option.required)
            }

            if ([3, 4, 5, 6, 7, 8, 9, 10].includes(option.type)) opt.type = option.type
            if (typeof option.name === 'string') opt.name = option.name
            if (typeof option.description === 'string') opt.description = option.description.slice(0, 100)

            if (Array.isArray(option.choices) && [3, 4, 10].includes(option.type)) {
                opt.choices = []

                for (const choice of option.choices.slice(0, 25)) {
                    const chc = {
                        name: 'choice',
                        value: '1'
                    }

                    if (typeof choice.name === 'string') chc.name = choice.name.slice(0, 100)
                    if (option.type === 3) chc.value = String(choice.value)
                    else chc.value = Number(choice.value) || 1

                    opt.choices.push(chc)
                }
            }

            data.command.options.push(opt)
        }
    }

    if ('scripts' in rawData && Array.isArray(rawData.scripts)) {
        data.scripts = validateCustomBehaviorScripts(rawData.scripts)
    } else if ('components' in rawData && Array.isArray(rawData.components)) {
        data.components = validateCustomBehaviorComponents(rawData.components)

        if (convertComponents) {
            data.scripts = [{ name: null, language: 1, code: convertComponentsToScript(data.components) }]
            delete data.components
        }
    }

    return data
}
