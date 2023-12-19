import { CanvasRenderingContext2D, Image, createCanvas, loadImage } from 'canvas'
import database from '../database'
import { MessageImage } from '../database/schemas/Servers'
import Logger from '../internals/Logger'
import { capitalizeFirstLetter } from '../internals/utility/Utils'

export const borderRadiuses = {
    none: 0,
    xs: 2,
    sm: 4,
    md: 8,
    lg: 16,
    xl: 32,
    circle: 70
}

export const textSizes = {
    h1: 96,
    h2: 60,
    h3: 40,
    h4: 36,
    h5: 24,
    h6: 22,
    subtitle1: 18,
    body2: 16,
    caption: 14
}

export const textStyles = ['normal', 'italic']
export const textTransforms = ['none', 'capitalize', 'uppercase', 'lowercase']
export const textDecorations = ['none', 'underline', 'line-through']
export const textAligns = ['center', 'start', 'end']

export async function generateImage(image: MessageImage) {
    const canvas = createCanvas(image.width, image.height),
        ctx = canvas.getContext('2d')

    ctx.save()

    ctx.fillStyle = image.background.color
    ctx.strokeStyle = image.background.color
    ctx.fillRect(image.width, image.height, image.width, image.height)
    ctx.lineJoin = 'round'
    ctx.lineWidth = borderRadiuses.lg
    ctx.strokeRect(borderRadiuses.lg / 2, borderRadiuses.lg / 2, image.width - borderRadiuses.lg, image.height - borderRadiuses.lg)
    ctx.fillRect(borderRadiuses.lg / 2, borderRadiuses.lg / 2, image.width - borderRadiuses.lg, image.height - borderRadiuses.lg)

    const { allowedImageHosts } = await database.json.get()

    if (image.background.url) {
        try {
            const url = new URL(image.background.url)

            if (!allowedImageHosts.includes(url.host)) {
                throw new Error(`Host ${url.host} is not in the list of allowed hosts`)
            }

            const backgroundImage = await loadImage(image.background.url)
            const widthRation = image.width / backgroundImage.width,
                heightRation = image.height / backgroundImage.height,
                ratio = widthRation > heightRation ? widthRation : heightRation

            roundImage(ctx, 0, 0, image.width, image.height, borderRadiuses.lg / 2)
            ctx.clip()
            drawImageProp(
                ctx,
                backgroundImage,
                image.width / 2 - (backgroundImage.width * ratio) / 2,
                image.height / 2 - (backgroundImage.height * ratio) / 2,
                backgroundImage.width * ratio,
                backgroundImage.height * ratio
            )
            ctx.restore()
        } catch (err) {
            Logger.error('[ImageGenerator]', err)
        }
    }

    for (const element of image.elements.reverse()) {
        if (element.type === 'IMAGE') {
            let elementImage: Image

            try {
                const url = new URL(element.url)

                if (!allowedImageHosts.includes(url.host)) {
                    throw new Error(`Host ${url.host} is not in the list of allowed hosts`)
                }

                elementImage = await loadImage(element.url)
            } catch (err) {
                Logger.error('[ImageGenerator]', err)
                continue
            }

            if (elementImage) {
                if (element.border_radius === 'circle') {
                    const radius = Math.min(element.height, element.width)

                    ctx.beginPath()
                    ctx.arc(element.posX + radius / 2, element.posY + radius / 2, radius / 2, 0, Math.PI * 2, true)
                    ctx.closePath()
                    ctx.clip()
                } else {
                    roundImage(ctx, element.posX, element.posY, element.width, element.height, borderRadiuses[element.border_radius])
                    ctx.clip()
                }

                drawImageProp(ctx, elementImage, element.posX, element.posY, element.width, element.height)
                ctx.restore()
            }
        } else if (element.type === 'TEXT') {
            const fontSize = canvas.width * (textSizes[element.size] / canvas.width)
            ctx.font = `${element.style} ${fontSize}px Inter`
            ctx.fillStyle = element.color
            ctx.textAlign = element.align
            ctx.textBaseline = 'top'

            if (element.align === 'center') {
                element.posX += element.width / 2
            } else if (element.align === 'end') {
                element.posX += element.width
            }

            if (element.transform === 'capitalize') {
                element.value = capitalizeFirstLetter(element.value)
            } else if (element.transform === 'lowercase') {
                element.value = element.value.toLowerCase()
            } else if (element.transform === 'uppercase') {
                element.value = element.value.toUpperCase()
            }

            const fitString = fittingString(ctx, element.value, element.width)
            const fitMeasure = ctx.measureText(fitString)

            ctx.fillText(fitString, element.posX, element.posY)

            let decPosX = element.posX,
                decPosY = element.posY

            if (element.align === 'center') {
                decPosX += fitMeasure.actualBoundingBoxLeft - fitMeasure.width
            } else if (element.align === 'end') {
                decPosX -= fitMeasure.width
            }

            if (element.decoration === 'underline') {
                decPosY += fontSize + 2
                ctx.fillRect(decPosX, decPosY, fitMeasure.width, 1)
            } else if (element.decoration === 'line-through') {
                decPosY += (fontSize + 5) / 2
                ctx.fillRect(decPosX, decPosY, fitMeasure.width, 1)
            }

            ctx.restore()
        }
    }

    return {
        buffer: canvas.toBuffer(),
        name: `lacuna-image-generator-${Date.now()}.png`
    }
}

export function roundImage(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
}

function drawImageProp(ctx: CanvasRenderingContext2D, img: Image, x: number, y: number, w: number, h: number, offsetX?: number, offsetY?: number) {
    if (arguments.length === 2) {
        x = y = 0
        w = ctx.canvas.width
        h = ctx.canvas.height
    }

    // default offset is center
    offsetX = typeof offsetX === 'number' ? offsetX : 0.5
    offsetY = typeof offsetY === 'number' ? offsetY : 0.5

    // keep bounds [0.0, 1.0]
    if (offsetX < 0) offsetX = 0
    if (offsetY < 0) offsetY = 0
    if (offsetX > 1) offsetX = 1
    if (offsetY > 1) offsetY = 1

    let iw = img.width,
        ih = img.height,
        r = Math.min(w / iw, h / ih),
        nw = iw * r, // new prop. width
        nh = ih * r, // new prop. height
        cx,
        cy,
        cw,
        ch,
        ar = 1

    // decide which gap to fill
    if (nw < w) ar = w / nw
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh // updated
    nw *= ar
    nh *= ar

    // calc source rectangle
    cw = iw / (nw / w)
    ch = ih / (nh / h)

    cx = (iw - cw) * offsetX
    cy = (ih - ch) * offsetY

    // make sure source rectangle is valid
    if (cx < 0) cx = 0
    if (cy < 0) cy = 0
    if (cw > iw) cw = iw
    if (ch > ih) ch = ih

    // fill image in dest. rectangle
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h)
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    // First, start by splitting all of our text into words, but splitting it into an array split by spaces
    let words = text.split(' ')
    let line = '' // This will store the text of the current line
    let testLine = '' // This will store the text when we add a word, to test if it's too long
    let lineArray = [] // This is an array of lines, which the function will return

    // Lets iterate over each word
    for (var n = 0; n < words.length; n++) {
        // Create a test line, and measure it..
        testLine += `${words[n]} `
        let metrics = ctx.measureText(testLine)
        let testWidth = metrics.width
        // If the width of this test line is more than the max width
        if (testWidth > maxWidth && n > 0) {
            // Then the line is finished, push the current line into "lineArray"
            lineArray.push([line, x, y])
            // Increase the line height, so a new line is started
            y += lineHeight
            // Update line and test line to use this word as the first word on the next line
            line = `${words[n]} `
            testLine = `${words[n]} `
        } else {
            // If the test line is still less than the max width, then add the word to the current line
            line += `${words[n]} `
        }
        // If we never reach the full max width, then there is only one line.. so push it into the lineArray so we return something
        if (n === words.length - 1) {
            lineArray.push([line, x, y])
        }
    }
    // Return the line array
    return lineArray
}

export function fittingString(ctx: CanvasRenderingContext2D, string: string, maxWidth: number) {
    let width = ctx.measureText(string).width

    if (width <= maxWidth) {
        return string
    } else {
        var len = string.length
        while (width >= maxWidth && len-- > 0) {
            string = string.substring(0, len)
            width = ctx.measureText(string).width
        }
        return string
    }
}
