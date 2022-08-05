<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-grey-2" style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('ims.opt_name_title') }}
            </div>

            <q-input v-model="option.appearance.label" class="q-pt-sm" :maxlength="100" filled dense hide-bottom-space>
              <template v-if="option.appearance.emoji.name" #prepend>
                <span class="text-caption">
                  {{ option.appearance.emoji.id ? `:${option.appearance.emoji.name}:` : option.appearance.emoji.name }}
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

          <div class="col-12">
            <div>
              {{ $t('ims.opt_description_title') }}
            </div>

            <q-input
              v-model="option.appearance.description"
              class="q-pt-sm"
              :maxlength="100"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>
        </div>
      </q-card-section>

      <q-list class="q-px-none q-py-md" dense>
        <q-item
          v-for="action in ['EPHEMERAL_REPLY', 'MODIFY_ROLES', 'OVERWRITE_CHANNEL_PERMISSIONS', 'RESTRICT_ROLES']"
          :key="action"
          tag="label"
          v-ripple
        >
          <q-item-section>
            <q-item-label>
              {{ $t(`common.actions_keys.${action}`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox v-model="option.options" :val="action" dense @update:model-value="onSelectOption"></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="option.options.includes('EPHEMERAL_REPLY')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('pages.guild.gs_message_template_title') }}
              </div>

              <MessageEditor :message="option.ephemeral_reply" avl-replacers="message guild member" class="q-pt-sm" />
            </div>
          </div>
        </q-card-section>
      </transition>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="option.options.includes('MODIFY_ROLES')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('common.add_roles') }}
              </div>

              <q-select
                v-model="option.modify_roles.add"
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

                <template #prepend>
                  <q-checkbox v-model="option.modify_roles.reversible_add" dense>
                    <q-tooltip
                      class="bg-black rounded-lg"
                      anchor="top middle"
                      self="bottom middle"
                      transition-show=""
                      transition-hide=""
                    >
                      {{ $t('ims.mr_reversible_mode') }}
                    </q-tooltip>
                  </q-checkbox>
                </template>
              </q-select>
            </div>

            <div class="col-12">
              <div>
                {{ $t('common.remove_roles') }}
              </div>

              <q-select
                v-model="option.modify_roles.remove"
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

                <template #prepend>
                  <q-checkbox v-model="option.modify_roles.reversible_remove" dense>
                    <q-tooltip
                      class="bg-black rounded-lg"
                      anchor="top middle"
                      self="bottom middle"
                      transition-show=""
                      transition-hide=""
                    >
                      {{ $t('ims.mr_reversible_mode') }}
                    </q-tooltip>
                  </q-checkbox>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
      </transition>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="option.options.includes('OVERWRITE_CHANNEL_PERMISSIONS')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('common.channels') }}
              </div>

              <q-select
                v-model="option.overwrite_channel_permissions.channels"
                :options="guild.channels"
                :max-values="8"
                option-label="name"
                option-value="id"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
                multiple
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

            <div class="col-12">
              <q-btn-dropdown
                class="full-width"
                :label="$t('common.permissions')"
                unelevated
                no-caps
                color="dark-grey-3"
              >
                <q-list>
                  <q-item v-for="(permission, i) in Object.keys(channelPermissions)" :key="i" tag="label" v-ripple>
                    <q-item-section>
                      <q-item-label>
                        {{ $t(`common.permissions_keys.${permission}`) }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-checkbox
                        v-model="option.overwrite_channel_permissions.permissions[permission]"
                        toggle-indeterminate
                        dense
                      ></q-checkbox>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
          </div>
        </q-card-section>
      </transition>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="option.options.includes('RESTRICT_ROLES')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('common.blocked_roles') }}
              </div>

              <q-select
                v-model="option.restricted_roles"
                :options="guild.roles"
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
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
      </transition>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-grey-3" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn class="full-width" :label="$t('done')" unelevated no-caps color="primary" @click="onConfirm" />
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
import { defineComponent, ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { discordChannelPermissions } from 'src/utils/Constants'
import { parseEmoji } from 'src/utils/Utils'
import { useGuildStore } from 'src/stores/guild'
import MessageEditor from '../MessageEditor.vue'

export default defineComponent({
  name: 'UtilityInteractiveMessageOption',

  emits: [...useDialogPluginComponent.emits],

  props: {
    optionProp: {
      type: Object,
      required: true
    }
  },

  components: {
    MessageEditor
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const option = ref(JSON.parse(JSON.stringify(props.optionProp))),
      channelPermissions = ref(discordChannelPermissions),
      emojiPickerModal = ref(false)

    return {
      guild,
      dialogRef,
      option,
      channelPermissions,
      emojiPickerModal,

      onConfirm() {
        onDialogOK({ option: option.value })
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
      this.option.appearance.emoji = emoji
      this.emojiPickerModal = false
    },
    onSelectOption(options) {
      if (options.includes('EPHEMERAL_REPLY') && !this.option.ephemeral_reply) {
        this.option.ephemeral_reply = {
          content: '',
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
        }
      }

      if (options.includes('MODIFY_ROLES') && !this.option.modify_roles) {
        this.option.modify_roles = {
          add: [],
          remove: [],
          reversible_add: true,
          reversible_remove: false,
          duration: 0
        }
      }

      if (options.includes('OVERWRITE_CHANNEL_PERMISSIONS') && !this.option.overwrite_channel_permissions) {
        this.option.overwrite_channel_permissions = {
          channels: [],
          permissions: {},
          reversible: true
        }
      }

      if (options.includes('RESTRICT_ROLES') && !this.option.restricted_roles) {
        this.option.restricted_roles = []
      }

      if (!options.includes('EPHEMERAL_REPLY')) {
        delete this.option.ephemeral_reply
      }

      if (!options.includes('MODIFY_ROLES')) {
        delete this.option.modify_roles
      }

      if (!options.includes('OVERWRITE_CHANNEL_PERMISSIONS')) {
        delete this.option.overwrite_channel_permissions
      }

      if (!options.includes('RESTRICT_ROLES')) {
        delete this.option.restricted_roles
      }
    }
  }
})
</script>
