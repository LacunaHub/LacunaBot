import { resolveEmbed } from '../Utils'

export function validateCustomBehaviorComponents(rawComponents) {
    const components = []

    for (const component of rawComponents) {
        if (component.type === 'CONDITION') {
            if (component.condition?.type === 'COMPARE_VALUES') {
                let compare_values = {
                    options: [],
                    operator: [
                        'EQUAL',
                        'NOT_EQUAL',
                        'GREATER_THAN',
                        'LESS_THAN',
                        'STARTS_WITH',
                        'ENDS_WITH',
                        'CONTAINS',
                        'NOT_CONTAINS'
                    ].includes(component.condition.compare_values?.operator)
                        ? component.condition.compare_values.operator
                        : 'EQUAL',
                    left:
                        typeof component.condition.compare_values?.left === 'string'
                            ? component.condition.compare_values.left
                            : '',
                    right:
                        typeof component.condition.compare_values?.right === 'string'
                            ? component.condition.compare_values.right
                            : ''
                }

                if (Array.isArray(component.condition.compare_values?.options)) {
                    if (component.condition.compare_values.options.includes('FALSE_REPLY')) {
                        if (component.condition.compare_values.false_reply) {
                            compare_values.false_reply = {
                                content:
                                    typeof component.condition.compare_values.false_reply.content === 'string'
                                        ? component.condition.compare_values.false_reply.content
                                        : '',
                                embed: resolveEmbed(component.condition.compare_values.false_reply.embed)
                            }

                            compare_values.options.push('FALSE_REPLY')
                        }
                    }

                    if (component.condition.compare_values.options.includes('FALSE_REPLY_EPHEMERAL'))
                        compare_values.options.push('FALSE_REPLY_EPHEMERAL')
                }

                components.push({
                    type: component.type,
                    condition: {
                        type: component.condition.type,
                        compare_values
                    }
                })
            }
        }

        if (component.type === 'ACTION') {
            if (component.action?.type === 'EXECUTE_CODE') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        execute_code: {
                            code:
                                typeof component.action.execute_code?.code === 'string'
                                    ? component.action.execute_code.code
                                    : ''
                        }
                    }
                })
            }

            if (component.action?.type === 'REPLY') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        reply: {
                            options: Array.isArray(component.action.reply?.options)
                                ? component.action.reply.options.filter(i => ['EPHEMERAL'].includes(i))
                                : [],
                            message: {
                                content:
                                    typeof component.action.reply?.message?.content === 'string'
                                        ? component.action.reply.message.content
                                        : '',
                                embed: resolveEmbed(component.action.reply?.message?.embed)
                            }
                        }
                    }
                })
            }

            if (component.action?.type === 'SEND_MESSAGE') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        send_message: {
                            options: Array.isArray(component.action.send_message?.options)
                                ? component.action.send_message.options.filter(i => ['TTS'].includes(i))
                                : [],
                            format:
                                typeof component.action.send_message?.format === 'string' &&
                                ['CHANNEL', 'CURRENT_CHANNEL'].includes(component.action.send_message.format)
                                    ? component.action.send_message.format
                                    : 'CHANNEL',
                            channel_id: null,
                            message: {
                                content:
                                    typeof component.action.send_message?.message?.content === 'string'
                                        ? component.action.send_message.message.content
                                        : '',
                                embed: resolveEmbed(component.action.send_message?.message?.embed)
                            }
                        }
                    }
                })
            }

            if (component.action?.type === 'MODIFY_ROLES') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        modify_roles: {
                            add: [],
                            remove: [],
                            user_id:
                                typeof component.action.modify_roles?.user_id === 'string'
                                    ? component.action.modify_roles.user_id
                                    : null
                        }
                    }
                })
            }

            if (component.action?.type === 'FORWARD_TO_COMMAND') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        forward_to_command:
                            typeof component.action.forward_to_command === 'string'
                                ? component.action.forward_to_command
                                : 'about'
                    }
                })
            }

            if (component.action?.type === 'MODIFY_WALLET') {
                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        modify_wallet: {
                            operator:
                                typeof component.action.modify_wallet?.operator === 'string' &&
                                ['INCREMENT', 'DECREMENT'].includes(component.action.modify_wallet.operator)
                                    ? component.action.modify_wallet.operator
                                    : 'INCREMENT',
                            amount:
                                typeof component.action.modify_wallet?.amount === 'string'
                                    ? component.action.modify_wallet.amount
                                    : '0',
                            user_id:
                                typeof component.action.modify_wallet?.user_id === 'string'
                                    ? component.action.modify_wallet.user_id
                                    : null,
                            currency_id:
                                typeof component.action.modify_wallet?.currency_id === 'string'
                                    ? component.action.modify_wallet.currency_id
                                    : null
                        }
                    }
                })
            }

            if (component.action?.type === 'SHOW_MODAL') {
                const { show_modal } = component.action

                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        show_modal: {
                            title: typeof show_modal.title === 'string' ? show_modal.title : null,
                            customId: typeof show_modal.customId === 'string' ? show_modal.customId : null,
                            components: Array.isArray(show_modal.components)
                                ? show_modal.components.map(row => {
                                      return row.map(comp => {
                                          return {
                                              type: 'TextInput',
                                              customId: typeof comp.customId === 'string' ? comp.customId : 'field-id',
                                              label: typeof comp.label === 'string' ? comp.label : 'Field',
                                              maxLength: typeof comp.minLength === 'number' ? comp.maxLength : 4000,
                                              minLength: typeof comp.minLength === 'number' ? comp.minLength : 0,
                                              placeholder:
                                                  typeof comp.placeholder === 'string' ? comp.placeholder : null,
                                              required: Boolean(comp.required),
                                              style: ['Short', 'Paragraph'].includes(comp.style) ? comp.style : 'Short',
                                              value: typeof comp.value === 'string' ? comp.value : null
                                          }
                                      })
                                  })
                                : []
                        }
                    }
                })
            }

            if (component.action?.type === 'OVERWRITE_CHANNEL_PERMISSIONS') {
                const { overwrite_channel_permissions } = component.action

                components.push({
                    type: component.type,
                    action: {
                        type: component.action.type,
                        overwrite_channel_permissions: {
                            channels:
                                Array.isArray(overwrite_channel_permissions.channels) &&
                                overwrite_channel_permissions.channels.every(i => typeof i === 'string')
                                    ? overwrite_channel_permissions.channels
                                    : [],
                            permissions:
                                typeof overwrite_channel_permissions.permissions === 'object' &&
                                overwrite_channel_permissions.permissions !== null &&
                                Object.values(overwrite_channel_permissions.permissions).every(
                                    i => typeof i === 'boolean' || i === null
                                )
                                    ? overwrite_channel_permissions.permissions
                                    : {},
                            user_or_role:
                                typeof overwrite_channel_permissions.user_or_role === 'string'
                                    ? overwrite_channel_permissions.user_or_role
                                    : ''
                        }
                    }
                })
            }
        }
    }

    return components
}
