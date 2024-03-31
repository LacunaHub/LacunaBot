const { existsSync, rmSync } = require('fs')
const tsconfig = require('./tsconfig.json')
const outDir = tsconfig.compilerOptions.outDir || './dist'

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })
