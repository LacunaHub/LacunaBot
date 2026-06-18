import { automationTriggers } from '../Constants'
import { suid } from '../Utils'
import { validateCustomBehaviorComponents } from './ValidateCustomBehaviorComponents'
import { convertComponentsToScript, validateCustomBehaviorScripts } from './ValidateCustomBehaviorScripts'

export function validateAutomation(rawData, convertComponents = false) {
    if (!rawData) throw new TypeError('"rawData" is required')

    const data = {
        id: suid(6),
        name: null,
        options: [],
        trigger: null
    }

    if (typeof rawData.name === 'string') data.name = rawData.name

    if (Array.isArray(rawData.options)) {
        if (rawData.options.includes('DISABLED')) data.options.push('DISABLED')
    }

    if (typeof rawData.trigger === 'string' && automationTriggers.includes(rawData.trigger))
        data.trigger = rawData.trigger

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
