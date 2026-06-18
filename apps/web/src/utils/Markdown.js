import { Renderer, marked } from 'marked'

const renderer = new Renderer()
renderer.link = (href, title, text) => {
    return `<a target="_blank" href="${href}" title="${title ?? ''}">${text}</a>`
}
renderer.heading = (text, level) => {
    const levels = {
        1: 'h4',
        2: 'h5',
        3: 'h6'
    }

    return `<div class="text-${levels[level] ?? 'h6'}" style="margin-bottom: 16px">${text}</div>`
}

export function parseMarkdown(content) {
    return marked.parse(content, { mangle: false, headerIds: false, renderer })
}
