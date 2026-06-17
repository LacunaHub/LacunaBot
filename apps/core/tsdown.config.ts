import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/**/*.ts'],
    clean: true,
    dts: false,
    unbundle: true,
    fixedExtension: false
})
