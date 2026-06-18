import { Picker } from 'emoji-mart-vue-fast/src'
import { boot } from 'quasar/wrappers'
import { useI18n } from 'vue-i18n'
import '../css/emoji-picker.scss'

export default boot(({ app }) => {
    app.component('emoji-picker', Picker)
    app.config.globalProperties.$getEmojiPickerI18n = () => {
        const { t } = useI18n()

        return {
            search: t('Components.EmojiPicker.Search'),
            notfound: t('Components.EmojiPicker.NotFound'),
            categories: {
                search: t('Components.EmojiPicker.Categories.Search'),
                recent: t('Components.EmojiPicker.Categories.Recent'),
                smileys: t('Components.EmojiPicker.Categories.Smileys'),
                people: t('Components.EmojiPicker.Categories.People'),
                nature: t('Components.EmojiPicker.Categories.Nature'),
                foods: t('Components.EmojiPicker.Categories.Foods'),
                activity: t('Components.EmojiPicker.Categories.Activity'),
                places: t('Components.EmojiPicker.Categories.Places'),
                objects: t('Components.EmojiPicker.Categories.Objects'),
                symbols: t('Components.EmojiPicker.Categories.Symbols'),
                flags: t('Components.EmojiPicker.Categories.Flags'),
                custom: t('Components.EmojiPicker.Categories.Custom')
            }
        }
    }
})

export { Picker }
