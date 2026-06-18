import { type ServerModulesAutomation, ServerModulesAutomationOptions } from '@/database/schemas/Servers.js'
import { isObject } from '@/internals/utility/Utils.js'
import { validateCustomBehaviorComponents, validateCustomBehaviorScripts } from './ValidateCustomCommand.js'

export function validateAutomation(data: ServerModulesAutomation) {
    if (!isObject(data)) return null

    const value = {
        id: data.id,
        name: data.name,
        options: [],
        trigger: data.trigger
    } as unknown as typeof data

    if (
        Array.isArray(data.options) &&
        data.options.every(v => Object.values(ServerModulesAutomationOptions).includes(v))
    )
        value.options = data.options

    if ('scripts' in data) {
        // @ts-ignore
        value['scripts'] = validateCustomBehaviorScripts(data.scripts)
    } else if ('components' in data) {
        // @ts-ignore
        value['components'] = validateCustomBehaviorComponents(data.components)
    }

    return value
}
