import { defineStore } from 'pinia'

export const useModalsStore = defineStore('modals', {
    state: () => ({
        lacunaDiamond: false
    }),

    actions: {
        open(modal) {
            this.$patch({ [modal]: true })
        },
        close(modal) {
            this.$patch({ [modal]: false })
        },
        toggle() {
            this.$patch({ [modal]: !this[modal] })
        }
    }
})
