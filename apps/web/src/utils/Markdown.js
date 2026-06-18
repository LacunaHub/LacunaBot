import DOMPurify from 'dompurify'
import { marked, Renderer } from 'marked'

const renderer = new Renderer()
renderer.html = function ({ text }) {
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

    return `<p>${escaped}</p>`
}
renderer.heading = function ({ depth, tokens }) {
    const level = Math.min(depth + 3, 6)
    return `<div class="text-h${level}" style="margin-bottom: 16px">${this.parser.parseInline(tokens)}</div>`
}
renderer.link = (href, title, text) => {
    return `<a target="_blank" href="${href}" title="${title ?? ''}" rel="noopener noreferrer">${text}</a>`
}

marked.use({ renderer })

export function parseMarkdown(content) {
    return DOMPurify.sanitize(marked.parse(content))
}
