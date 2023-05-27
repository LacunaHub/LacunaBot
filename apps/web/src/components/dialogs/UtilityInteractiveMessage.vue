<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 900px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'ims.add_im' : 'ims.edit_im') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div v-if="mode === 'CREATE'" class="col-12">
            <div>
              {{ $t('common.channel') }}
            </div>

            <q-select
              v-model="im.channel_id"
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
                  color="dark-1"
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
              {{ $t('common.message') }}
            </div>

            <MessageEditor :message="im.message" hide-replacers hide-code-snippets class="q-pt-sm" />
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('ims.actions_rows_title') }}
            </div>
          </div>

          <div class="col-12" v-for="(row, i) in im.components" :key="i">
            <q-card flat bordered class="bg-transparent rounded-lg">
              <q-card-section v-if="row[0].type === 'BUTTON'">
                <div class="row q-col-gutter-sm">
                  <div class="col-auto" v-for="(button, ii) in row" :key="button.id">
                    <q-chip
                      class="rounded-lg full-width no-shadow"
                      square
                      :label="button.appearance.label"
                      :ripple="false"
                      :style="{ background: buttonStyles[button.appearance.style] }"
                      clickable
                      removable
                      @click="buttonDialog(button, i)"
                      @remove="row.length == 1 ? im.components.splice(i, 1) : row.splice(ii, 1)"
                    ></q-chip>
                  </div>

                  <div v-if="row.length < 5" class="col-auto">
                    <q-chip
                      class="rounded-lg dashed-border no-shadow full-width"
                      outline
                      square
                      clickable
                      @click="addButtonComponent(i)"
                    >
                      <q-icon name="add" size="24px"></q-icon>
                    </q-chip>
                  </div>
                </div>
              </q-card-section>

              <q-card-section v-if="row[0].type === 'SELECT_MENU'">
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('ims.select_menu_placeholder_title') }}
                    </div>

                    <q-input
                      v-model="row[0].placeholder"
                      class="q-pt-sm"
                      :maxlength="32"
                      filled
                      dense
                      hide-bottom-space
                    ></q-input>
                  </div>

                  <div class="col-12">
                    <div class="row q-col-gutter-sm">
                      <div class="col-auto" v-for="(option, ii) in row[0]._options" :key="ii">
                        <q-chip
                          class="rounded-lg full-width no-shadow"
                          square
                          :label="option.appearance.label"
                          :ripple="false"
                          clickable
                          removable
                          @click="optionDialog(option, i)"
                          @remove="
                            row[0]._options.length == 1 ? im.components.splice(i, 1) : row[0]._options.splice(ii, 1)
                          "
                        ></q-chip>
                      </div>

                      <div v-if="row[0]._options.length < 25" class="col-auto">
                        <q-chip
                          class="rounded-lg dashed-border no-shadow full-width"
                          outline
                          square
                          clickable
                          @click="addSelectMenuOption(i)"
                        >
                          <q-icon name="add" size="24px"></q-icon>
                        </q-chip>
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn
                  @click="im.components.splice(i, 1)"
                  :label="$t('remove')"
                  color="negative"
                  flat
                  no-caps
                  unelevated
                ></q-btn>
              </q-card-actions>
            </q-card>
          </div>

          <div v-if="im.components.length < 5" class="col-12">
            <q-btn-dropdown class="full-width dashed-border" icon="add" flat>
              <q-list>
                <q-item clickable v-close-popup @click="addActionRow('BUTTON')">
                  <q-item-section>
                    <q-item-label>
                      {{ $t('ims.action_row_buttons_title') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="addActionRow('SELECT_MENU')">
                  <q-item-section>
                    <q-item-label>
                      {{ $t('ims.action_row_select_menu_title') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('common.reactions') }}
            </div>

            <div class="row q-col-gutter-sm q-pt-sm">
              <div class="col-auto" v-for="(reaction, i) in im.reactions" :key="i">
                <q-chip
                  class="rounded-lg full-width no-shadow"
                  square
                  :label="reaction.emoji.id ? `:${reaction.emoji.name}:` : reaction.emoji.name"
                  :ripple="false"
                  clickable
                  removable
                  @click="reactionDialog(reaction)"
                  @remove="im.reactions.splice(i, 1)"
                ></q-chip>
              </div>

              <div v-if="im.reactions.length < 10" class="col-auto">
                <q-chip
                  class="rounded-lg dashed-border no-shadow full-width"
                  outline
                  square
                  clickable
                  @click="emojiPickerModal = true"
                >
                  <q-icon name="add" size="24px"></q-icon>
                </q-chip>
              </div>
            </div>
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
          @select="addReaction"
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
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import MessageEditor from '../MessageEditor.vue'
import { interfaces } from 'src/boot/axios'
import { parseEmoji, suid } from 'src/utils/Utils'
import { imButtonStyles } from 'src/utils/Constants'
import UtilityInteractiveMessageButton from './UtilityInteractiveMessageButton.vue'
import UtilityInteractiveMessageOption from './UtilityInteractiveMessageOption.vue'
import UtilityInteractiveMessageReaction from './UtilityInteractiveMessageReaction.vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'UtilityInteractiveMessage',

  emits: [...useDialogPluginComponent.emits],

  props: {
    imProp: {
      type: Object,
      default: null
    }
  },

  components: {
    MessageEditor
  },

  setup(props) {
    const $q = useQuasar(),
      { t: $t } = useI18n()

    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.imProp ? 'UPDATE' : 'CREATE')
    const im = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.imProp))
        : {
            channel_id: null,
            message: {
              content: null,
              embed: {
                active: false,
                title: null,
                description: null,
                url: null,
                timestamp: null,
                color: null,
                footer: { text: null, icon_url: null },
                image: { url: null },
                thumbnail: { url: null },
                author: { name: null, url: null, icon_url: null },
                fields: []
              }
            },
            components: [],
            reactions: []
          }
    )

    let confirmLoading = ref(false),
      buttonStyles = ref(imButtonStyles),
      emojiPickerModal = ref(false)

    const isValid = computed(() => {
      return Boolean(
        im.value.channel_id &&
          (im.value.message.content || im.value.message.embed.active) &&
          (im.value.components.length || im.value.reactions.length) &&
          im.value.components.flat().every(i => {
            if (i.type == 'BUTTON')
              return (
                (i.appearance.label || i.appearance.emoji.name) &&
                (i.options.length || (i.appearance.style == 'LINK' && i.appearance.url))
              )
            if (i.type == 'SELECT_MENU')
              return i._options.length && i._options.every(ii => ii.options.length && ii.appearance.label)
          }) &&
          im.value.reactions.every(i => i.emoji.name && i.options.length)
      )
    })

    return {
      guild,
      dialogRef,
      mode,
      im,

      confirmLoading,
      buttonStyles,
      emojiPickerModal,

      isValid,

      onConfirm() {
        if (isValid.value) {
          confirmLoading.value = true

          interfaces.guilds
            .updateInteractiveMessages(guild._id, { method: mode.value.toLowerCase(), data: im.value })
            .then(response => {
              onDialogOK({ mode: mode.value, im: response.data })
            })
            .catch(err => {
              console.error(err)

              $q.notify({
                message: $t(`errors.ims.${err.response.data}`),
                classes: 'rounded-lg q-notification-custom',
                color: 'black',
                icon: 'error',
                iconColor: 'negative',
                timeout: 5000
              })
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
          .updateInteractiveMessages(guild._id, { method: 'delete', data: im.value })
          .then(() => {
            onDialogOK({ mode: 'DELETE', im: im.value })
          })
          .catch(err => {
            console.error(err)

            $q.notify({
              message: $t(`errors.ims.${err.response.data}`),
              classes: 'rounded-lg q-notification-custom',
              color: 'black',
              icon: 'error',
              iconColor: 'negative',
              timeout: 5000
            })
          })
          .finally(() => (confirmLoading.value = false))
      }
    }
  },

  methods: {
    addActionRow(type) {
      let component = {
        id: suid(8),
        type
      }

      if (type === 'BUTTON') {
        component = Object.assign(component, {
          options: [],
          appearance: {
            label: 'LABEL',
            style: 'PRIMARY',
            emoji: {
              id: null,
              name: null,
              animated: false
            },
            url: null
          }
        })
      }

      if (type === 'SELECT_MENU') {
        component = Object.assign(component, {
          placeholder: null,
          _options: [
            {
              options: [],
              appearance: {
                label: 'Label',
                value: suid(8),
                description: null,
                emoji: {
                  id: null,
                  name: null,
                  animated: false
                }
              }
            }
          ]
        })
      }

      this.im.components.push([component])
    },
    addButtonComponent(rowIndex) {
      const actionRow = this.im.components[rowIndex]

      if (!actionRow) return null

      actionRow.push({
        id: suid(8),
        type: 'BUTTON',
        options: [],
        appearance: {
          label: 'LABEL',
          style: 'PRIMARY',
          emoji: {
            id: null,
            name: null,
            animated: false
          },
          url: null
        }
      })
    },
    addSelectMenuOption(rowIndex) {
      const actionRow = this.im.components[rowIndex]

      if (!actionRow) return null

      actionRow[0]._options.push({
        options: [],
        appearance: {
          label: 'Label',
          value: suid(8),
          description: null,
          emoji: {
            id: null,
            name: null,
            animated: false
          }
        }
      })
    },
    addReaction(emoji) {
      if (this.im.reactions.length >= 10) return null

      emoji = parseEmoji(emoji.custom ? emoji.emoticons[0] : emoji.native)

      this.im.reactions.push({
        id: suid(8),
        options: [],
        emoji
      })
      this.emojiPickerModal = false
    },
    buttonDialog(btn, rowIndex) {
      const row = this.im.components[rowIndex]

      this.$q
        .dialog({
          component: UtilityInteractiveMessageButton,

          componentProps: {
            buttonProp: btn
          }
        })
        .onOk(payload => {
          const { button } = payload
          const index = row.findIndex(i => i.id === button.id)

          row[index] = button
        })
    },
    optionDialog(opt, rowIndex) {
      const row = this.im.components[rowIndex]

      this.$q
        .dialog({
          component: UtilityInteractiveMessageOption,

          componentProps: {
            optionProp: opt
          }
        })
        .onOk(payload => {
          const { option } = payload
          const index = row[0]._options.findIndex(i => i.appearance.value === option.appearance.value)

          row[0]._options[index] = option
        })
    },
    reactionDialog(config) {
      this.$q
        .dialog({
          component: UtilityInteractiveMessageReaction,

          componentProps: {
            reactionProp: config
          }
        })
        .onOk(payload => {
          const { reaction } = payload
          const index = this.im.reactions.findIndex(i => i.id === reaction.id)

          this.im.reactions[index] = reaction
        })
    }
  }
})
</script>
