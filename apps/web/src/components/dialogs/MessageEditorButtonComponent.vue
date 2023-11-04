<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <div>
              {{ $t('ims.btn_name_title') }}
            </div>

            <q-input v-model="button.label" class="q-pt-sm" :maxlength="80" filled dense hide-bottom-space>
              <template v-if="button.emoji.name" #prepend>
                <span class="text-caption">
                  {{ button.emoji.id ? `:${button.emoji.name}:` : button.emoji.name }}
                </span>
              </template>

              <template #append>
                <q-icon
                  class="q-field__focusable-action"
                  name="emoji_emotions"
                  @click="emojiPickerModal = true"
                ></q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-6">
            <div>
              {{ $t('ims.btn_style_title') }}
            </div>

            <q-select
              v-model="button.style"
              :options="['Primary', 'Secondary', 'Success', 'Danger', 'Link']"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              @update:model-value="onChangeStyle"
            >
              <template #selected-item="{ opt }">
                <span>
                  {{ $t(`common.discord_button_styles.${opt.toUpperCase()}`) }}
                </span>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label>
                      {{ $t(`common.discord_button_styles.${opt.toUpperCase()}`) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div v-if="button.style === 'Link'" class="col-12">
            <div>
              {{ $t('ims.btn_url_title') }}
            </div>

            <q-input
              v-model="button.url"
              class="q-pt-sm"
              :maxlength="256"
              type="url"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>

          <div v-else class="col-12">
            <div>
              {{ $t('identifier') }}
            </div>

            <q-input
              v-model="button.customId"
              class="q-pt-sm"
              :maxlength="100"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              class="full-width"
              :label="$t('done')"
              :disable="!isValid"
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="emojiPickerModal" transition-show="jump-down" transition-hide="jump-up">
      <q-card style="max-width: 380px">
        <emoji-picker
          :data="guild.emojiIndex"
          @select="onSelectEmoji"
          set="twitter"
          :show-preview="false"
          :i18n="$getEmojiPickerI18n()"
        ></emoji-picker>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { parseEmoji } from 'src/utils/Utils'
import { computed, defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MessageEditorButtonComponent',

  emits: [...useDialogPluginComponent.emits],

  props: {
    buttonProp: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const button = ref(JSON.parse(JSON.stringify(props.buttonProp))),
      emojiPickerModal = ref(false)

    const isValid = computed(() => {
      return Boolean((button.value.label || button.value.emoji.name) && (button.value.customId || button.value.url))
    })

    return {
      guild,
      dialogRef,
      button,
      emojiPickerModal,

      isValid,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ button: button.value })
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      }
    }
  },

  methods: {
    onSelectEmoji(emoji) {
      emoji = parseEmoji(emoji.custom ? emoji.emoticons[0] : emoji.native)
      this.button.emoji = emoji
      this.emojiPickerModal = false
    },
    onChangeStyle(style) {
      if (style === 'Link') {
        this.button.customId = null
      }
    }
  }
})
</script>
