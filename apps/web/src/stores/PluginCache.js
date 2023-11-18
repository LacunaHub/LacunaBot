import { defineStore } from 'pinia'

export const usePluginCacheStore = defineStore('pluginCache', {
    state: () => ({
        total: null,
        plugins: [],
        repositories: []
    }),

    actions: {
        cacheRepository(data) {
            this.repositories.push(data)
        },
        getRepository(fullName) {
            return this.repositories.find(v => v.full_name === fullName)
        }
    }
})
