<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDismiss"
    transition-show="jump-down"
    transition-hide="jump-up"
    backdrop-filter="blur(8px)"
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="q-dialog-card bg-dark-1" flat>
      <q-card-section class="q-dialog-card-content">
        <q-item class="q-py-md">
          <q-item-section avatar style="min-width: 48px">
            <q-avatar size="48px">
              <img :src="props.plugin.owner_avatar_url" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="ellipsis">
              {{ props.plugin.full_name }}
            </q-item-label>

            <q-item-label class="text--secondary ellipsis">
              <q-skeleton v-if="pageLoading" type="text" width="25%" height="18px" />
              <span v-else>
                {{ plugin.summary_l10ns[i18n.locale.value] || plugin.summary || props.plugin.description }}
              </span>
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn
              icon="fab fa-github"
              round
              unelevated
              no-caps
              :href="`https://github.com/${props.plugin.full_name}`"
              target="_blank"
            />
          </q-item-section>
        </q-item>

        <q-card-section>
          <div v-if="pageLoading" class="row q-col-gutter-md">
            <div class="col-12 flex justify-between items-center">
              <q-skeleton type="text" width="25%" height="32px" />
              <q-skeleton type="text" width="32px" />
            </div>

            <div class="col-12">
              <q-card class="bg-dark-2" flat>
                <q-card-section>
                  <q-skeleton type="text" width="25%" height="32px" />
                  <q-skeleton type="text" width="90%" />
                  <q-skeleton type="text" width="40%" />
                  <q-skeleton type="text" width="100%" />
                  <div class="q-my-md"></div>
                  <q-skeleton type="text" width="35%" height="32px" />
                  <q-skeleton type="text" width="80%" />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12">
              <q-card class="bg-dark-2" flat>
                <q-card-section>
                  <q-skeleton type="rect" width="100%" height="80px" />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div v-else class="row q-col-gutter-md">
            <div class="col-12 flex justify-between items-center">
              <div class="text-h6">
                {{ plugin.name_l10ns[i18n.locale.value] || plugin.name || $t('Common.None') }}
              </div>

              <div class="text--secondary">v{{ plugin.version || '0.0.1' }}</div>
            </div>

            <div class="col-12">
              <q-card class="bg-dark-2" flat>
                <q-card-section>
                  <article
                    class="markdown-body"
                    v-html="parseMarkdown(plugin.description_l10ns[i18n.locale.value] || plugin.description)"
                  ></article>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12">
              <q-list class="bg-dark-2 overflow-hidden rounded-borders">
                <q-item v-for="(puzzle, i) in pluginPuzzles" :key="i" class="q-pa-md">
                  <q-item-section side>
                    <q-avatar rounded color="dark-3" :icon="puzzle.icon" />
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ puzzle.label }}
                    </q-item-label>

                    <q-item-label class="text--secondary">
                      {{ puzzle.description }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card-section>
      </q-card-section>

      <q-card-section class="q-dialog-card-actions row reverse q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-btn
            class="full-width"
            :label="$t('Common.Add')"
            unelevated
            @click="onConfirm"
            :disable="pageLoading"
            :loading="confirmLoading"
            no-caps
            color="primary"
          >
            <template #loading>
              <q-spinner-dots color="white"></q-spinner-dots>
            </template>
          </q-btn>
        </div>

        <div class="col-12 col-md-6">
          <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { usePluginCacheStore } from 'src/stores/PluginCache'
import { useGuildStore } from 'src/stores/guild'
import { localeStringsMap } from 'src/utils/Constants'
import { parseMarkdown } from 'src/utils/Markdown'
import { handleAxiosError } from 'src/utils/Utils'
import { computed, onMounted, ref } from 'vue'
import { event } from 'vue-gtag'
import { useI18n } from 'vue-i18n'

defineEmits(useDialogPluginComponent.emits)
const props = defineProps({
  plugin: { required: true }
})

const $q = useQuasar(),
  { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const i18n = useI18n()

const pageLoading = ref(true)
const guild = useGuildStore()
const pluginCache = usePluginCacheStore(),
  plugin = ref(null),
  pluginPuzzles = computed(() => {
    if (!plugin.value) return []

    return plugin.value.puzzles.map(puzzle => {
      return {
        label: 'trigger' in puzzle.data ? puzzle.data.name : puzzle.data.command.name,
        description:
          'trigger' in puzzle.data
            ? i18n.t(localeStringsMap.automationTriggers[puzzle.data.trigger])
            : puzzle.data.command.description,
        icon: puzzle.type === 'AUTOMATION' ? 'r_bolt' : 'r_terminal'
      }
    })
  })

const confirmLoading = ref(false)

const onConfirm = async () => {
    event('add_plugin', { event_category: 'custom_behavior', event_label: props.plugin.full_name })
    onDialogOK(plugin)
  },
  onCancel = () => {
    onDialogCancel()
  },
  onDismiss = () => {
    onDialogHide()
  }

onMounted(async () => {
  const cache = pluginCache.getRepository(props.plugin.full_name)

  if (cache) {
    plugin.value = cache
  } else {
    try {
      const response = await interfaces.common.getPlugin(props.plugin.full_name, guild._id)

      plugin.value = response.data
      pluginCache.cacheRepository({ full_name: props.plugin.full_name, ...response.data })
    } catch (err) {
      const error = handleAxiosError(err)

      $q.notify({
        message: error.message,
        classes: 'q-notification-custom',
        color: 'black',
        icon: 'error',
        iconColor: 'negative',
        timeout: 5000
      })

      return
    }
  }

  pageLoading.value = false
})
</script>
