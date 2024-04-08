import { Renderer, marked } from 'marked'
import { defineStore } from 'pinia'
import { interfaces } from 'src/boot/axios'

const renderer = new Renderer()
renderer.link = (href, title, text) => {
    if (href.startsWith('../')) href = href.replace('../', 'https://docs.lacunabot.com/')

    return `<a target="_blank" href="${href}" title="${title}">${text}</a>`
}

export const useReleaseNotesCache = defineStore('releaseNotesCache', {
    state: () => ({
        releases: [],
        current: null
    }),

    actions: {
        async getReleaseNotes() {
            try {
                const response = await interfaces.common.getReleaseNotes()

                if (response.status === 200) {
                    this.$patch({ releases: response.data, current: response.data[0] })
                }
            } catch (err) {}
        },
        parseContent(content) {
            return marked.parse(content, { mangle: false, headerIds: false, renderer: renderer })
        }
    }
})
