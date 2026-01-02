import js from '@eslint/js'
import configPrettier from 'eslint-config-prettier'
import pluginVue from 'eslint-plugin-vue'
import { defineConfig } from 'eslint/config'
import globals from 'globals'

export default defineConfig([
    // Ignored files and directories (replaces .eslintignore)
    {
        ignores: [
            'dist/**',
            'src-capacitor/**',
            'src-cordova/**',
            '.quasar/**',
            'node_modules/**',
            '**/*.ts',
            'eslint.config.js'
        ]
    },

    // Base config
    js.configs.recommended,
    ...pluginVue.configs['flat/essential'],

    // Project specific config
    {
        name: 'lacuna-main-config',
        files: ['**/*.js', '**/*.vue'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ga: 'readonly',
                cordova: 'readonly',
                __statics: 'readonly',
                __QUASAR_SSR__: 'readonly',
                __QUASAR_SSR_SERVER__: 'readonly',
                __QUASAR_SSR_CLIENT__: 'readonly',
                __QUASAR_SSR_PWA__: 'readonly',
                process: 'readonly',
                Capacitor: 'readonly',
                chrome: 'readonly'
            }
        },
        rules: {
            'prefer-promise-reject-errors': 'off',
            // In production, a debugger is a no-no
            'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
        }
    },

    // Prettier should always be imported last
    configPrettier
])
