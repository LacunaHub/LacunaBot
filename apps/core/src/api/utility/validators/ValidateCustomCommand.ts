import {
    ServerModulesCustomCommand,
    ServerModulesCustomCommandComponent,
    ServerModulesCustomCommandComponentActionReplyOptions,
    ServerModulesCustomCommandComponentActionSendMessageFormats,
    ServerModulesCustomCommandComponentActionSendMessageOptions,
    ServerModulesCustomCommandComponentActionTypes,
    ServerModulesCustomCommandComponentConditionCompareValuesOperators,
    ServerModulesCustomCommandComponentConditionCompareValuesOptions,
    ServerModulesCustomCommandComponentConditionTypes,
    ServerModulesCustomCommandComponentTypes,
    ServerModulesCustomCommandOptions,
    ServerModulesCustomCommandScript,
    ServerModulesCustomCommandScriptLanguages
} from '@/database/schemas/Servers'
import { isObject } from '../../../internals/utility/Utils'
import { validateTemplateMessage } from './ValidateTemplateMessage'

export function validateCustomCommand(data: ServerModulesCustomCommand): ServerModulesCustomCommand {
    if (!isObject(data)) return null

    const value = {
        id: data.id,
        options: [],
        command: data.command
    } as typeof data

    if (Array.isArray(data.options) && data.options.every(v => Object.values(ServerModulesCustomCommandOptions).includes(v)))
        value.options = data.options

    if ('scripts' in data) {
        value['scripts'] = validateCustomBehaviorScripts(data.scripts)
    } else if ('components' in data) {
        value['components'] = validateCustomBehaviorComponents(data.components)
    }

    if ('throttling' in data && isObject(data.throttling)) {
        value.throttling = {
            type: 'PER_USER',
            max_uses: 1,
            timeout: 60
        }

        if (typeof data.throttling.type === 'string') value.throttling.type = data.throttling.type
        if (typeof data.throttling.max_uses === 'number') value.throttling.max_uses = data.throttling.max_uses
        if (typeof data.throttling.timeout === 'number') value.throttling.timeout = data.throttling.timeout
    }

    return value
}

export function validateCustomBehaviorScripts(scripts: ServerModulesCustomCommandScript[]) {
    const array = []

    for (let script of scripts) {
        if (typeof script.name !== 'string' && script.name !== null) continue
        if (typeof script.language !== 'number' || !Object.values(ServerModulesCustomCommandScriptLanguages).includes(script.language)) continue
        if (typeof script.code !== 'string') continue

        script = {
            name: script.name,
            language: script.language,
            code: script.code
        }

        array.push(script)
    }

    return array
}

export function validateCustomBehaviorComponents(components: ServerModulesCustomCommandComponent[]) {
    const array = []

    for (let component of components) {
        if (typeof component.type !== 'string' || !Object.values(ServerModulesCustomCommandComponentTypes).includes(component.type)) continue

        if ('condition' in component) {
            if (
                typeof component.condition.type !== 'string' ||
                !Object.values(ServerModulesCustomCommandComponentConditionTypes).includes(component.condition.type)
            )
                continue

            const { compare_values } = component.condition

            if (
                typeof compare_values.operator !== 'string' ||
                !Object.values(ServerModulesCustomCommandComponentConditionCompareValuesOperators).includes(compare_values.operator)
            )
                continue
            if (typeof compare_values.left !== 'string') continue
            if (typeof compare_values.right !== 'string') continue
            if (
                !Array.isArray(compare_values.options) ||
                !compare_values.options.every(v => Object.values(ServerModulesCustomCommandComponentConditionCompareValuesOptions).includes(v))
            )
                continue

            const falseReply = 'false_reply' in compare_values ? validateTemplateMessage(compare_values.false_reply) : null

            component = {
                type: component.type,
                condition: {
                    type: component.condition.type,
                    compare_values: {
                        operator: compare_values.operator,
                        left: compare_values.left,
                        right: compare_values.right,
                        options: compare_values.options,
                        false_reply: falseReply
                    }
                }
            }
        }

        if ('action' in component) {
            if (
                typeof component.action.type !== 'string' ||
                !Object.values(ServerModulesCustomCommandComponentActionTypes).includes(component.action.type)
            )
                continue

            const { action } = component

            if (isObject(action.execute_code)) {
                if (typeof action.execute_code.code !== 'string') continue
                component = {
                    type: component.type,
                    action: {
                        type: action.type,
                        execute_code: {
                            code: action.execute_code.code
                        }
                    }
                }
            }

            if (typeof action.forward_to_command === 'string') {
                component = {
                    type: component.type,
                    action: {
                        type: action.type,
                        forward_to_command: action.forward_to_command
                    }
                }
            }

            if (isObject(action.modify_roles)) {
                if (!Array.isArray(action.modify_roles.add) || !action.modify_roles.add.every(v => typeof v === 'string')) continue
                if (!Array.isArray(action.modify_roles.remove) || !action.modify_roles.remove.every(v => typeof v === 'string')) continue
                if (typeof action.modify_roles.user_id !== 'string') continue

                component = {
                    type: component.type,
                    action: {
                        type: action.type,
                        modify_roles: {
                            add: action.modify_roles.add,
                            remove: action.modify_roles.remove,
                            user_id: action.modify_roles.user_id
                        }
                    }
                }
            }

            if (isObject(action.modify_wallet)) {
                if (typeof action.modify_wallet.amount !== 'string') continue
                if (typeof action.modify_wallet.currency_id !== 'string' && action.modify_wallet.currency_id !== null) continue
                if (typeof action.modify_wallet.user_id !== 'string' && action.modify_wallet.user_id !== null) continue

                component = {
                    type: component.type,
                    action: {
                        type: action.type,
                        modify_wallet: {
                            amount: action.modify_wallet.amount,
                            currency_id: action.modify_wallet.currency_id,
                            user_id: action.modify_wallet.user_id
                        }
                    }
                }
            }

            if (isObject(action.overwrite_channel_permissions)) {
                if (
                    !Array.isArray(action.overwrite_channel_permissions.channels) ||
                    !action.overwrite_channel_permissions.channels.every(v => typeof v === 'string')
                )
                    continue
                if (
                    !isObject(action.overwrite_channel_permissions.permissions) ||
                    !Object.values(action.overwrite_channel_permissions.permissions).every(v => typeof v === 'boolean' || v === null)
                )
                    continue
                if (typeof action.overwrite_channel_permissions.user_or_role !== 'string') continue

                component = {
                    type: component.type,
                    action: {
                        type: action.type,
                        overwrite_channel_permissions: {
                            channels: action.overwrite_channel_permissions.channels,
                            permissions: action.overwrite_channel_permissions.permissions,
                            user_or_role: action.overwrite_channel_permissions.user_or_role
                        }
                    }
                }
            }

            if (isObject(action.reply)) {
                if (
                    !Array.isArray(action.reply.options) ||
                    !action.reply.options.every(v => Object.values(ServerModulesCustomCommandComponentActionReplyOptions).includes(v))
                )
                    continue

                component = {
                    type: component.type,
                    action: {
                        type: action.type,
                        reply: {
                            options: action.reply.options,
                            message: validateTemplateMessage(action.reply.message)
                        }
                    }
                }
            }

            if (isObject(action.send_message)) {
                if (
                    !Array.isArray(action.send_message.options) ||
                    !action.send_message.options.every(v => Object.values(ServerModulesCustomCommandComponentActionSendMessageOptions).includes(v))
                )
                    continue
                if (
                    typeof action.send_message.format !== 'string' ||
                    !Object.values(ServerModulesCustomCommandComponentActionSendMessageFormats).includes(action.send_message.format)
                )
                    continue
                if (typeof action.send_message.channel_id !== 'string') continue

                component = {
                    type: component.type,
                    action: {
                        type: action.type,
                        send_message: {
                            options: action.send_message.options,
                            format: action.send_message.format,
                            channel_id: action.send_message.channel_id,
                            message: validateTemplateMessage(action.send_message.message)
                        }
                    }
                }
            }

            if (isObject(action.show_modal)) {
                if (typeof action.show_modal.title !== 'string') continue
                if (typeof action.show_modal.customId !== 'string') continue
                if (!Array.isArray(action.show_modal.components)) continue

                component = {
                    type: component.type,
                    action: {
                        type: action.type,
                        show_modal: {
                            title: action.show_modal.title,
                            customId: action.show_modal.customId,
                            components: action.show_modal.components
                        }
                    }
                }
            }
        }

        array.push(component)
    }

    return array
}
