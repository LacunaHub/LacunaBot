<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-grey-2" style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'irs.add_ir' : 'irs.edit_ir') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section v-if="confirmError">
        <q-banner class="rounded-lg bg-dark-grey-3" dense>
          <span>
            {{ $t(`errors.irs.${confirmError}`) }}
          </span>

          <template #avatar>
            <q-icon name="error" color="negative"></q-icon>
          </template>
        </q-banner>
      </q-card-section>

      <q-card-section v-if="mode === 'CREATE'">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-btn-toggle
              v-model="ir.type"
              :options="[
                { label: $t('common.role'), value: 'ROLE' },
                { label: $t('common.channel'), value: 'CHANNEL' }
              ]"
              class="rounded-lg bg-dark-grey-3"
              unelevated
              no-caps
              spread
              @update:model-value="onChangeType"
            >
            </q-btn-toggle>
          </div>
        </div>
      </q-card-section>

      <q-list class="q-px-none q-py-md" dense>
        <q-item tag="label" v-ripple="ir.type !== 'CHANNEL'" :disable="ir.type === 'CHANNEL'">
          <q-item-section>
            <q-item-label>
              {{ $t('irs.single_element_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('irs.single_element_description') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox v-model="ir.element.single" :disable="ir.type === 'CHANNEL'" dense></q-checkbox>
          </q-item-section>
        </q-item>

        <q-item tag="label" v-ripple>
          <q-item-section>
            <q-item-label>
              {{ $t('irs.reverse_element_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox v-model="ir.element.reverse" dense></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-section v-if="mode === 'CREATE'">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('common.channel') }}
            </div>

            <q-select
              v-model="ir.message.channel_id"
              :options="guild.channelsText"
              option-label="name"
              option-value="id"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
            >
              <template #selected-item="{ opt }">
                <q-chip
                  class="rounded-lg"
                  color="dark-grey-1"
                  square
                  :label="opt.name ?? opt"
                  :icon="opt.icon"
                  size="sm"
                  :ripple="false"
                ></q-chip>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section avatar>
                    <q-icon :name="opt.icon"></q-icon>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ opt.name }}
                    </q-item-label>

                    <q-item-label class="text--secondary">
                      {{ opt.parentName }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('irs.message_id_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('irs.message_id_description') }}
            </div>

            <q-input v-model="ir.message.id" class="q-pt-sm" :maxlength="64" filled dense hide-bottom-space></q-input>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div v-if="mode === 'CREATE'" class="col-12">
            <div>
              {{ $t('automoder.nnm_removable_symbols.EMOJIS') }}
            </div>

            <q-input :model-value="emoji" class="q-pt-sm" readonly filled dense hide-bottom-space>
              <template #append>
                <q-icon
                  class="q-field__focusable-action"
                  name="emoji_emotions"
                  @click="emojiPickerModal = true"
                ></q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('irs.references_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('irs.references_description') }}
            </div>

            <q-select
              v-if="ir.type === 'ROLE'"
              v-model="ir.references"
              :options="guild.rolesUnmanaged"
              option-label="name"
              option-value="id"
              use-chips
              class="q-pt-sm"
              multiple
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
              :max-values="5"
            >
              <template #selected-item="{ opt, index, removeAtIndex }">
                <q-chip
                  class="rounded-lg"
                  square
                  :label="opt.name ?? opt"
                  size="sm"
                  :style="`background: ${opt.color}`"
                  :ripple="false"
                  removable
                  @remove="removeAtIndex(index)"
                ></q-chip>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item
                  clickable
                  @click="toggleOption(opt)"
                  :active="selected"
                  :disable="opt.higher"
                  active-class="menu-item--active"
                >
                  <q-item-section>
                    <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-select
              v-if="ir.type === 'CHANNEL'"
              v-model="ir.references"
              :options="guild.channels"
              option-label="name"
              option-value="id"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
              multiple
              :max-values="5"
            >
              <template #selected-item="{ opt, index, removeAtIndex }">
                <q-chip
                  class="rounded-lg"
                  color="dark-grey-1"
                  square
                  :label="opt.name ?? opt"
                  :icon="opt.icon"
                  size="sm"
                  :ripple="false"
                  removable
                  @remove="removeAtIndex(index)"
                ></q-chip>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section avatar>
                    <q-icon :name="opt.icon"></q-icon>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ opt.name }}
                    </q-item-label>

                    <q-item-label class="text--secondary">
                      {{ opt.parentName }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-grey-3" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              v-if="mode === 'CREATE'"
              class="full-width"
              :label="$t('add')"
              :disable="!isValid"
              :loading="confirmLoading"
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            >
              <template #loading>
                <q-spinner-dots color="white"></q-spinner-dots>
              </template>
            </q-btn>

            <q-btn-dropdown
              v-if="mode === 'UPDATE'"
              class="full-width rounded-lg"
              :label="$t('done')"
              :disable="!isValid"
              :loading="confirmLoading"
              split
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            >
              <q-list dense>
                <q-item clickable v-close-popup @click="onDelete" :disable="confirmLoading">
                  <q-item-section class="text-negative">
                    <q-item-label>
                      {{ $t('delete') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <template #loading>
                <q-spinner-dots color="white"></q-spinner-dots>
              </template>
            </q-btn-dropdown>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="emojiPickerModal" transition-show="jump-down" transition-hide="jump-up">
      <q-card class="rounded-lg" style="max-width: 380px">
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
import { computed, defineComponent, ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { parseEmoji, suid } from 'src/utils/Utils'
import { interfaces } from 'src/boot/axios'
import { useGuildStore } from 'src/stores/guild'

export default defineComponent({
  name: 'UtilityInteractiveReaction',

  emits: [...useDialogPluginComponent.emits],

  props: {
    irProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.irProp ? 'UPDATE' : 'CREATE')
    const ir = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.irProp))
        : {
            id: `L${suid(9)}`,
            type: 'ROLE',
            element: {
              single: false,
              reverse: false
            },
            message: {
              channel_id: null,
              id: ''
            },
            emoji: '',
            references: []
          }
    )

    let confirmLoading = ref(false),
      confirmError = ref(null),
      emojiPickerModal = ref(false)

    const isValid = computed(() => {
      return Boolean(ir.value.message.channel_id && ir.value.message.id) && ir.value.emoji && ir.value.references.length
    })

    const emoji = computed(() => {
      const parsed = typeof ir.value.emoji === 'string' ? parseEmoji(ir.value.emoji) : ir.value.emoji

      return parsed.id ? `:${parsed.name}:` : parsed.name
    })

    return {
      guild,
      dialogRef,
      mode,
      ir,

      confirmLoading,
      confirmError,
      emojiPickerModal,

      isValid,
      emoji,

      onConfirm() {
        if (isValid.value) {
          confirmLoading.value = true

          interfaces.guilds
            .updateInteractiveReactions(guild._id, { method: mode.value.toLowerCase(), data: ir.value })
            .then(response => {
              onDialogOK({ mode: mode.value, ir: response.data })
            })
            .catch(err => {
              confirmError.value = err.response.data
              console.log(err)
            })
            .finally(() => (confirmLoading.value = false))
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        confirmLoading.value = true

        interfaces.guilds
          .updateInteractiveReactions(guild._id, { method: 'delete', data: ir.value })
          .then(() => {
            onDialogOK({ mode: 'DELETE', ir: ir.value })
          })
          .catch(err => {
            confirmError.value = err.response.data
            console.log(err)
          })
          .finally(() => (confirmLoading.value = false))
      }
    }
  },

  methods: {
    onChangeType() {
      this.ir.references = []

      if (this.ir.type === 'CHANNEL') {
        this.ir.element.single = false
      }
    },
    onSelectEmoji(emoji) {
      this.ir.emoji = emoji.custom ? emoji.emoticons[0] : emoji.native
      this.emojiPickerModal = false
    }
  }
})
</script>
