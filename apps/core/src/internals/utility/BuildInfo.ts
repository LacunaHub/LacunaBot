import { existsSync, readFileSync } from 'node:fs'
import { parseJSON } from './Utils.js'

export interface BuildInfo {
    sha: string
    shaShort: string
    ref: string
    refType: 'branch' | 'tag'
}

const readBuildInfo = () => {
    const path = '../../buildinfo.json'
    if (!existsSync(path)) return null

    const file = readFileSync(path, 'utf-8')
    return parseJSON<Partial<BuildInfo>>(file)
}

export const buildInfo = readBuildInfo()
