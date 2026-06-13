import { ServerModulesAutomation, ServerModulesAutomationOptions } from '@/database/schemas/Servers'
import { isObject } from '../../../internals/utility/Utils'
import { validateCustomBehaviorComponents, validateCustomBehaviorScripts } from './ValidateCustomCommand'

export function validateAutomation(data: ServerModulesAutomation): ServerModulesAutomation {
    if (!isObject(data)) return null

    const value = {
        id: data.id,
        name: data.name,
        options: [],
        trigger: data.trigger
    } as typeof data

    if (Array.isArray(data.options) && data.options.every(v => Object.values(ServerModulesAutomationOptions).includes(v)))
        value.options = data.options

    if ('scripts' in data) {
        value['scripts'] = validateCustomBehaviorScripts(data.scripts)
    } else if ('components' in data) {
        value['components'] = validateCustomBehaviorComponents(data.components)
    }

    return value
}
