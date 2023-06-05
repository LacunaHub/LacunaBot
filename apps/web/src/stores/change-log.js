import { defineStore } from 'pinia'
import { marked, Renderer } from 'marked'

const renderer = new Renderer()
renderer.link = (href, title, text) => {
    if (href.startsWith('../')) href = href.replace('../', 'https://docs.lacunabot.com/')

    return `<a target="_blank" href="${href}">${text}</a>`
}

export const useChangeLogStore = defineStore('change-log', {
    state: () => ({
        list: [],
        current: null
    }),

    actions: {
        async getChangeLog() {
            try {
                const response = await fetch(
                    'https://raw.githubusercontent.com/LacunaHub/Docs/master/other/change-log.md',
                    { method: 'GET' }
                )

                if (response.ok) {
                    const content = await response.text()
                    const headerRegexp = /###?\s\d+\.\d+[\.\d]*/

                    const versions = content.match(new RegExp(headerRegexp, 'g'))
                    const contentParts = content.split(headerRegexp)

                    contentParts.shift()
                    const changeLogs = []

                    for (const version of versions) {
                        const index = versions.indexOf(version)

                        changeLogs.push({
                            version: version.replace(/###?\s/, ''),
                            content: contentParts[index].trim()
                        })
                    }

                    this.$patch({ list: changeLogs, current: changeLogs[0] })
                }
            } catch (err) {}
        },
        parseContent(content) {
            return marked.parse(content, { mangle: false, headerIds: false, renderer: renderer })
        }
    }
})
