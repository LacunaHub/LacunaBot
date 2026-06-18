export function validateCustomBehaviorScripts(rawScripts) {
    const scripts = []

    for (const script of rawScripts) {
        const value = {
            name: null,
            language: 1,
            code: ''
        }

        if (typeof script.name === 'string') value.name = script.name.slice(0, 100)
        if (typeof script.language === 'number' && [1].includes(script.language)) value.language = script.language
        if (typeof script.code === 'string') value.code = script.code

        scripts.push(value)
    }

    return scripts
}

export function convertComponentsToScript(components) {
    let script = ''
    if (!components.length) return script
    if (components.some(i => i.action?.type === 'EXECUTE_CODE')) {
        script = components.find(i => i.action?.type === 'EXECUTE_CODE').action.execute_code.code
        return script
    }

    const replaceWithTemplateString = string =>
        string ? `\`${string.replace(/{{\s*/g, '${').replace(/\s*}}/g, '}')}\`` : null
    const convertTemplateMessage = template => {
        let content, embed, components

        if (template.content) content = replaceWithTemplateString(template.content)
        if (template.embed && template.embed.active) {
            let url = template.embed.url ? replaceWithTemplateString(template.embed.url) : null,
                footer_icon_url = template.embed.footer.icon_url
                    ? replaceWithTemplateString(template.embed.footer.icon_url)
                    : null,
                image_url = template.embed.image.url ? replaceWithTemplateString(template.embed.image.url) : null,
                thumbnail_url = template.embed.thumbnail.url
                    ? replaceWithTemplateString(template.embed.thumbnail.url)
                    : null,
                author_url = template.embed.author.url ? replaceWithTemplateString(template.embed.author.url) : null,
                author_icon_url = template.embed.author.icon_url
                    ? replaceWithTemplateString(template.embed.author.icon_url)
                    : null

            embed = {
                title: template.embed.title ? replaceWithTemplateString(template.embed.title) : null,
                description: template.embed.description ? replaceWithTemplateString(template.embed.description) : null,
                url: url,
                timestamp: template.embed.timestamp ? replaceWithTemplateString(template.embed.timestamp) : null,
                color: template.embed.color || null,
                footer: {
                    text: template.embed.footer.text ? replaceWithTemplateString(template.embed.footer.text) : null,
                    icon_url: footer_icon_url
                },
                image: image_url ? { url: image_url } : null,
                thumbnail: thumbnail_url ? { url: thumbnail_url } : null,
                author: {
                    name: template.embed.author.name ? replaceWithTemplateString(template.embed.author.name) : null,
                    url: author_url,
                    icon_url: author_icon_url
                },
                fields: template.embed.fields.length
                    ? template.embed.fields
                          .filter(
                              i =>
                                  typeof i.name === 'string' &&
                                  i.name.length &&
                                  typeof i.value === 'string' &&
                                  i.value.length
                          )
                          .map(field => {
                              return {
                                  name: replaceWithTemplateString(field.name),
                                  value: replaceWithTemplateString(field.value),
                                  inline: Boolean(field.inline)
                              }
                          })
                    : []
            }
        }
        if (Array.isArray(template.components))
            components = JSON.parse(JSON.stringify(template.components).replace(/:\s*"([^"]+)"/g, ': "`$1`"'))

        const result = {}
        if (content) result.content = content
        if (embed) result.embeds = [embed]
        if (components) result.components = components

        return result
    }
    const stringify = value => {
        const string = JSON.stringify(value, null, 2)
        return string.replace(/"/g, '')
    }

    for (const component of components) {
        if ('condition' in component) {
            if (component.condition.type === 'COMPARE_VALUES') {
                const { compare_values } = component.condition

                const leftVal = replaceWithTemplateString(compare_values.left),
                    rightVal = replaceWithTemplateString(compare_values.right)

                let condition
                switch (compare_values.operator) {
                    case 'EQUAL':
                        condition = `${leftVal} !== ${rightVal}`
                        break
                    case 'NOT_EQUAL':
                        condition = `${leftVal} === \`${rightVal}`
                        break
                    case 'GREATER_THAN':
                        condition = `${leftVal} > ${rightVal}`
                        break
                    case 'LESS_THAN':
                        condition = `${leftVal} < ${rightVal}`
                        break
                    case 'CONTAINS':
                        condition = `!${leftVal}.includes(${rightVal})`
                        break
                    case 'NOT_CONTAINS':
                        condition = `${leftVal}.includes(${rightVal})`
                        break
                    case 'STARTS_WITH':
                        condition = `!${leftVal}.startsWith(${rightVal})`
                        break
                    case 'ENDS_WITH':
                        condition = `!${leftVal}.endsWith(${rightVal})`
                        break
                }

                script += `if (${condition}) {\n`

                if (compare_values.options.includes('FALSE_REPLY') && 'false_reply' in compare_values) {
                    script += `await reply(`
                    script += `${stringify({
                        ...convertTemplateMessage(compare_values.false_reply),
                        ephemeral: compare_values.options.includes('FALSE_REPLY_EPHEMERAL')
                    })}`
                    script += ')\n'
                }

                script += `return null\n}\n\n`
            }
        } else if ('action' in component) {
            const { action } = component

            if (action.modify_roles) {
                if (action.modify_roles.add.length) {
                    script += `await modifyUserRoles(`
                    script += `${replaceWithTemplateString(action.modify_roles.user_id) || 'member.user.id'},`
                    script += `${JSON.stringify(action.modify_roles.add)}`
                    script += ')\n\n'
                }

                if (action.modify_roles.remove.length) {
                    script += `await modifyUserRoles(`
                    script += `${replaceWithTemplateString(action.modify_roles.user_id) || 'member.user.id'},`
                    script += `${JSON.stringify(action.modify_roles.remove)},`
                    script += `'remove')\n\n`
                }
            }

            if (action.modify_wallet) {
                script += `await modifyUserWallet(`
                script += `${replaceWithTemplateString(action.modify_wallet.user_id) || 'member.user.id'},`
                script += `+${replaceWithTemplateString(action.modify_wallet.amount)},`
                script += `${replaceWithTemplateString(action.modify_wallet.currency_id)}`
                script += ')\n\n'
            }

            if (action.overwrite_channel_permissions) {
                script += `await overwriteChannelPermissions(`
                script += `${JSON.stringify(action.overwrite_channel_permissions.channels)},`
                script += `${stringify(action.overwrite_channel_permissions.permissions, null)},`
                script += `${replaceWithTemplateString(action.overwrite_channel_permissions.user_or_role)}`
                script += ')\n\n'
            }

            if (action.reply) {
                script += `await reply(`
                script += `${stringify({ ...convertTemplateMessage(action.reply.message), ephemeral: action.reply.options.includes('EPHEMERAL') })}`
                script += ')\n\n'
            }

            if (action.send_message) {
                script += `await sendMessage(`
                script += `${action.send_message.channel_id || 'channel.id'},`
                script += `${stringify(convertTemplateMessage(action.send_message.message))}`
                script += ')\n\n'
            }

            if (action.show_modal) {
                script += `await showModal(${stringify(JSON.parse(JSON.stringify(action.show_modal).replace(/:\s*"([^"]+)"/g, ': "`$1`"')))})\n\n`
            }
        }
    }

    return script
}
