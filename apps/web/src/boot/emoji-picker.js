import { boot } from 'quasar/wrappers'
import { Picker } from 'emoji-mart-vue-fast/src'
import '../css/emoji-picker.scss'
import { useI18n } from 'vue-i18n'

export default boot(({ app }) => {
    app.component('emoji-picker', Picker)
    app.config.globalProperties.$getEmojiPickerI18n = () => {
        const { t } = useI18n()

        return {
            search: t('emoji_picker.search'),
            notfound: t('emoji_picker.notfound'),
            categories: {
                search: t('emoji_picker.categories.search'),
                recent: t('emoji_picker.categories.recent'),
                smileys: t('emoji_picker.categories.smileys'),
                people: t('emoji_picker.categories.people'),
                nature: t('emoji_picker.categories.nature'),
                foods: t('emoji_picker.categories.foods'),
                activity: t('emoji_picker.categories.activity'),
                places: t('emoji_picker.categories.places'),
                objects: t('emoji_picker.categories.objects'),
                symbols: t('emoji_picker.categories.symbols'),
                flags: t('emoji_picker.categories.flags'),
                custom: t('emoji_picker.categories.custom')
            }
        }
    }
})

export { Picker }
