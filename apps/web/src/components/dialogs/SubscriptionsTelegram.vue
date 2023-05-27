<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'add' : 'edit') }} Telegram
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section v-if="mode === 'CREATE'">
        <q-banner class="rounded-lg bg-dark-2" dense>
          <i18n-t keypath="subscriptions.telegram_help_note" tag="span">
            <template #botLink>
              <a class="origin" href="https://t.me/VoidLacunaBot" target="_blank">@VoidLacunaBot</a>
            </template>
          </i18n-t>

          <template #avatar>
            <q-icon name="info" color="info"></q-icon>
          </template>
        </q-banner>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('subscriptions.twitch_channel_name_title') }}
            </div>

            <div v-if="mode === 'CREATE'" class="text--secondary">
              {{ $t('subscriptions.telegram_channel_name_subtitle') }}
            </div>

            <q-select
              v-if="mode === 'CREATE'"
              v-model="telegram.channel"
              :options="foundChannels"
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

              <template v-slot:prepend>
                <q-icon name="alternate_email" />
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label>
                      {{ opt.name }}
                    </q-item-label>

                    <q-item-label class="text--secondary">
                      {{ opt.username }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input
              v-if="mode === 'UPDATE'"
              :model-value="telegram.channel_name"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              disable
              readonly
            >
            </q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('subscriptions.notifications_channel_title') }}
            </div>

            <q-select
              v-model="telegram.notification_channel_id"
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
        </div>
      </q-card-section>

      <q-list class="q-px-none q-py-md">
        <q-item tag="label" dense v-ripple>
          <q-item-section>
            <q-item-label>
              {{ $t('common.permissions_keys.MENTION_EVERYONE') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox v-model="telegram.options" val="MENTION_EVERYONE" dense></q-checkbox>
          </q-item-section>
        </q-item>

        <q-item tag="label" dense v-ripple>
          <q-item-section>
            <q-item-label>
              {{ $t('subscriptions.mention_roles_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox
              v-model="telegram.options"
              val="MENTION_ROLES"
              dense
              @update:model-value="onSelectOption"
            ></q-checkbox>
          </q-item-section>
        </q-item>

        <q-item
          v-if="guild.channelsAnnouncement.some(i => i.id === telegram.notification_channel_id)"
          tag="label"
          dense
          v-ripple
        >
          <q-item-section>
            <q-item-label>
              {{ $t('subscriptions.crosspost_message_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox v-model="telegram.options" val="CROSSPOST_MESSAGE" dense></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="telegram.options.includes('MENTION_ROLES')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('common.roles') }}
              </div>

              <q-select
                v-model="telegram.role_mentions"
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
                :max-values="3"
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
  </q-dialog>
</template>

<script>
import { computed, defineComponent, ref } from 'vue'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { interfaces } from 'src/boot/axios'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'SubscriptionsTelegram',

  emits: [...useDialogPluginComponent.emits],

  props: {
    telegramProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const $q = useQuasar(),
      { t: $t } = useI18n()

    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.telegramProp ? 'UPDATE' : 'CREATE')
    const telegram = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.telegramProp))
        : {
            channel: null,
            notification_channel_id: null,
            options: []
          }
    )

    let confirmLoading = ref(false),
      foundChannels = ref([])

    const isValid = computed(() => {
      return telegram.value.channel !== null && telegram.value.notification_channel_id !== null
    })

    return {
      guild,
      dialogRef,
      mode,
      telegram,

      confirmLoading,
      foundChannels,

      isValid,

      onConfirm() {
        if (isValid.value) {
          confirmLoading.value = true

          interfaces.guilds
            .updateTelegramSubscriptions(guild._id, { method: mode.value.toLowerCase(), data: telegram.value })
            .then(response => {
              onDialogOK({ mode: mode.value, telegram: response.data })
            })
            .catch(err => {
              console.error(err)

              $q.notify({
                message: $t(`errors.subscriptions.${err.response.data}`),
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
          .updateTelegramSubscriptions(guild._id, { method: 'delete', data: telegram.value })
          .then(() => {
            onDialogOK({ mode: 'DELETE', telegram: telegram.value })
          })
          .catch(err => {
            console.error(err)

            $q.notify({
              message: $t(`errors.subscriptions.${err.response.data}`),
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
    getChannels(value, update, abort) {
      if (value.length <= 2) {
        update(() => (this.foundChannels = []))
      } else {
        interfaces.subscriptions
          .searchTelegramChannels(this.guild._id, { query: value })
          .then(response => {
            update(() => (this.foundChannels = response.data))
          })
          .catch(err => {
            abort()
            console.error(err)
          })
      }
    },
    onSelectOption(options) {
      if (options.includes('MENTION_ROLES') && !this.telegram.role_mentions) {
        this.telegram.role_mentions = []
      }

      if (!options.includes('MENTION_ROLES')) {
        delete this.telegram.role_mentions
      }
    }
  }
})
</script>
