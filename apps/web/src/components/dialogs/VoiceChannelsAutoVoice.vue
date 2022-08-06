<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-grey-2" style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'auto_voices.add_auto_voice' : 'auto_voices.edit_auto_voice') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section v-if="confirmError">
        <q-banner class="rounded-lg bg-dark-grey-3" dense>
          <span>
            {{ $t(`errors.auto_voices.${confirmError}`) }}
          </span>

          <template #avatar>
            <q-icon name="error" color="negative"></q-icon>
          </template>
        </q-banner>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('common.channel') }}
            </div>
            <div class="text--secondary">
              {{ $t('auto_voices.voice_channel_description') }}
            </div>

            <q-select
              v-if="mode === 'CREATE'"
              v-model="autoVoice.channel_id"
              :options="unusedVoiceChannels"
              option-label="name"
              option-value="id"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
              @update:model-value="onSelectVoiceChannel"
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

            <q-select
              v-if="mode === 'UPDATE'"
              :model-value="autoVoice.channel_id"
              :options="guild.channelsVoice"
              option-label="name"
              option-value="id"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
              disable
              readonly
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
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('auto_voices.default_name_title') }}
            </div>

            <q-input
              v-model.trim="autoVoice.default.name"
              class="q-pt-sm"
              :maxlength="100"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('auto_voices.default_user_limit_title') }}
            </div>

            <q-slider
              v-model.number="autoVoice.default.limit"
              class="q-pt-sm q-px-sm"
              :min="0"
              :max="99"
              label
            ></q-slider>
          </div>

          <div class="col-12">
            <div>
              {{ $t('auto_voices.default_category_title') }}
            </div>

            <q-select
              v-model="autoVoice.default.category_id"
              :options="guild.channelsCategory"
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
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('auto_voices.default_position_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('auto_voices.default_position_description') }}
            </div>

            <q-select
              v-model="autoVoice.default.position"
              :options="['TOP', 'BOTTOM']"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
            >
              <template #selected-item="{ opt }">
                <span>
                  {{ $t(`auto_voices.default_positions.${opt}`) }}
                </span>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label>
                      {{ $t(`auto_voices.default_positions.${opt}`) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>

      <q-list class="q-px-none q-py-md" dense>
        <q-item class="q-mb-sm">
          <q-item-section>
            <q-item-label>
              {{ $t('auto_voices.owner_permissions_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('auto_voices.owner_permissions_description') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-for="permission in ownerPermissions"
          :key="permission.key"
          @click="onChangePermissions(permission.bit)"
          tag="label"
          v-ripple
        >
          <q-item-section>
            <q-item-label>
              {{ $t(`common.permissions_keys.${permission.key}`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox :model-value="hasPermission(permission.bit)" dense></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('common.allowed_roles') }}
            </div>

            <q-select
              v-model="autoVoice.allowed_roles"
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

          <div class="col-12">
            <div>
              {{ $t('common.blocked_roles') }}
            </div>

            <q-select
              v-model="autoVoice.blocked_roles"
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

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('auto_voices.moderator_roles_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('auto_voices.moderator_roles_description') }}
            </div>

            <q-select
              v-model="autoVoice.moderator_roles"
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
  </q-dialog>
</template>

<script>
import { computed, defineComponent, ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { interfaces } from 'src/boot/axios'

export default defineComponent({
  name: 'VoiceChannelsAutoVoice',

  emits: [...useDialogPluginComponent.emits],

  props: {
    autoVoiceProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.autoVoiceProp ? 'UPDATE' : 'CREATE')
    const autoVoice = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.autoVoiceProp))
        : {
            channel_id: null,
            default: {
              name: '#{index}: {member}',
              limit: 0,
              permissions: 0,
              category_id: null,
              position: 'BOTTOM'
            },
            allowed_roles: [],
            blocked_roles: [],
            moderator_roles: [],
            children: []
          }
    )

    let confirmLoading = ref(false),
      confirmError = ref(null)

    const isValid = computed(() => {
      return autoVoice.value.channel_id
    })

    const unusedVoiceChannels = computed(() => {
      return guild.channelsVoice.filter(i => !guild.modules.voice_manager.autovoices.some(j => j.channel_id === i.id))
    })

    return {
      guild,
      dialogRef,
      mode,
      autoVoice,

      confirmLoading,
      confirmError,

      isValid,
      unusedVoiceChannels,

      onConfirm() {
        if (isValid.value) {
          confirmLoading.value = true

          interfaces.guilds
            .updateAutoVoices(guild._id, { method: mode.value.toLowerCase(), data: autoVoice.value })
            .then(response => {
              onDialogOK({ mode: mode.value, autoVoice: response.data })
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
          .updateAutoVoices(guild._id, { method: 'delete', data: autoVoice.value })
          .then(() => {
            onDialogOK({ mode: 'DELETE', autoVoice: autoVoice.value })
          })
          .catch(err => {
            confirmError.value = err.response.data
            console.log(err)
          })
          .finally(() => (confirmLoading.value = false))
      }
    }
  },

  data() {
    return {
      ownerPermissions: [
        { key: 'MANAGE_CHANNELS', bit: 16 },
        { key: 'MANAGE_ROLES', bit: 268435456 },
        { key: 'PRIORITY_SPEAKER', bit: 256 },
        { key: 'MOVE_MEMBERS', bit: 16777216 }
      ]
    }
  },

  methods: {
    onSelectVoiceChannel(channel_id) {
      const channel = this.guild.channelsVoice.find(i => i.id === channel_id)
      this.autoVoice.default.category_id = channel.parentId
    },
    hasPermission(...bits) {
      return bits.every(bit => (this.autoVoice.default.permissions & bit) === bit)
    },
    onChangePermissions(bit) {
      const has = this.hasPermission(bit)

      if (has) {
        this.autoVoice.default.permissions = this.autoVoice.default.permissions ^ bit
      } else {
        this.autoVoice.default.permissions = this.autoVoice.default.permissions | bit
      }
    }
  }
})
</script>
