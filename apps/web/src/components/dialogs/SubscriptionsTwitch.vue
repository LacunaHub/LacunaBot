<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('Components.Subscriptions.ChannelName') }}
            </div>

            <q-select
              v-if="mode === 'CREATE'"
              v-model="twitch.broadcaster"
              :options="foundBroadcasters"
              option-label="name"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              hide-dropdown-icon
              use-input
              fill-input
              hide-selected
              input-debounce="1000"
              @filter="getChannels"
            >
              <template #loading>
                <q-spinner-dots color="white"></q-spinner-dots>
              </template>

              <template #prepend>
                <q-avatar v-if="twitch.broadcaster">
                  <img :src="twitch.broadcaster.thumbnail" :alt="twitch.broadcaster.name" />
                </q-avatar>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section avatar>
                    <q-avatar>
                      <img :src="opt.thumbnail" :alt="opt.name" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ opt.name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input
              v-if="mode === 'UPDATE'"
              :model-value="twitch.broadcaster_name"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              disable
              readonly
            >
              <template #prepend>
                <q-avatar>
                  <img :src="twitch.broadcaster_thumbnail_url" :alt="twitch.broadcaster_name" />
                </q-avatar>
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('Components.Subscriptions.NotificationsChannel') }}
            </div>

            <q-select
              v-model="twitch.notification_channel_id"
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
                <q-chip color="dark-1" square :label="opt.name ?? opt" :icon="opt.icon" size="sm"></q-chip>
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

      <div class="q-pa-md">
        <q-list class="bg-dark-2 overflow-hidden rounded-borders">
          <q-item tag="label">
            <q-item-section side>
              <q-checkbox v-model="twitch.display_stream_preview" dense></q-checkbox>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ $t('Components.Subscriptions.TwitchDisplayStreamPreview') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item tag="label">
            <q-item-section side>
              <q-checkbox v-model="twitch.options" val="CREATE_THREAD" dense></q-checkbox>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ $t('Components.Subscriptions.CreateThread') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="guild.channelsAnnouncement.some(i => i.id === twitch.notification_channel_id)" tag="label">
            <q-item-section side>
              <q-checkbox v-model="twitch.options" val="CROSSPOST_MESSAGE" dense></q-checkbox>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ $t('Components.Subscriptions.CrosspostMessage') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('Components.Subscriptions.NotificationsText') }}
            </div>

            <MessageEditor :message="twitch.notification_message" avl-replacers="subs" disable-embed class="q-pt-sm" />
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              v-if="mode === 'CREATE'"
              class="full-width"
              :label="$t('Common.Add')"
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
              class="full-width"
              :label="$t('Common.Done')"
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
                      {{ $t('Common.Delete') }}
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
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { useGuildStore } from 'src/stores/guild'
import { handleAxiosError } from 'src/utils/Utils'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MessageEditor from '../MessageEditor.vue'

export default defineComponent({
  name: 'SubscriptionsTwitch',

  emits: [...useDialogPluginComponent.emits],

  props: {
    twitchProp: {
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

    const mode = ref(props.twitchProp ? 'UPDATE' : 'CREATE')
    const twitch = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.twitchProp))
        : {
            broadcaster: null,
            notification_channel_id: null,
            notification_message: {
              content: ''
            },
            display_stream_preview: true,
            options: []
          }
    )

    if (typeof twitch.value.options === 'undefined') {
      twitch.value.options = []
    }

    let confirmLoading = ref(false),
      foundBroadcasters = ref([])

    const isValid = computed(() => {
      return twitch.value.broadcaster !== null && twitch.value.notification_channel_id !== null
    })

    return {
      guild,
      dialogRef,
      mode,
      twitch,

      confirmLoading,
      foundBroadcasters,

      isValid,

      onConfirm() {
        if (isValid.value) {
          confirmLoading.value = true

          return interfaces.guilds
            .updateTwitchSubscriptions(guild._id, { method: mode.value.toLowerCase(), data: twitch.value })
            .then(response => {
              onDialogOK({ mode: mode.value, twitch: response.data })
            })
            .catch(err => {
              const error = handleAxiosError(err)

              $q.notify({
                message: error.message,
                classes: 'q-notification-custom',
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

        return interfaces.guilds
          .updateTwitchSubscriptions(guild._id, { method: 'delete', data: twitch.value })
          .then(() => {
            onDialogOK({ mode: 'DELETE', twitch: twitch.value })
          })
          .catch(err => {
            const error = handleAxiosError(err)

            $q.notify({
              message: error.message,
              classes: 'q-notification-custom',
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
    getChannels(value, update, abort) {
      if (value.length <= 2) {
        update(() => (this.foundBroadcasters = []))
      } else {
        interfaces.subscriptions
          .searchTwitchChannels(this.guild._id, { query: value })
          .then(response => {
            update(() => (this.foundBroadcasters = response.data))
          })
          .catch(err => {
            abort()
            console.error(err)
          })
      }
    }
  }
})
</script>
