<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="q-dialog-card bg-dark-1" flat style="width: 1000px">
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
            {{ props.plugin.description }}
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
              {{ plugin.manifest.name }}
            </div>

            <div class="text--secondary">v{{ plugin.manifest.version }}</div>
          </div>

          <div class="col-12">
            <q-card class="bg-dark-2" flat>
              <q-card-section>
                <article class="markdown-body" v-html="parseMarkdown(plugin.description)"></article>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card class="bg-dark-2" flat>
              <q-card-section>
                <q-tree :nodes="pluginPuzzlesTree" node-key="label">
                  <template #default-body="{ node }">
                    <span class="text--secondary">
                      {{ node.description }}
                    </span>
                  </template>
                </q-tree>
              </q-card-section>
            </q-card>
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
import { useI18n } from 'vue-i18n'

defineEmits(useDialogPluginComponent.emits)
const props = defineProps({
  plugin: { required: true }
})

const $q = useQuasar(),
  { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const { t: $t } = useI18n()

const pageLoading = ref(true)
const guild = useGuildStore()
const pluginCache = usePluginCacheStore(),
  plugin = ref(null),
  pluginPuzzlesTree = computed(() => {
    if (!plugin.value) return []

    return plugin.value.puzzles.map(v => {
      return {
        label: 'trigger' in v.data ? v.data.name : v.data.command.name,
        icon: v.type === 'AUTOMATION' ? 'bolt' : 'reply',
        description:
          'trigger' in v.data ? $t(localeStringsMap.automationTriggers[v.data.trigger]) : v.data.command.description,
        children: v.data.components.map(vv => {
          return {
            icon: vv.type === 'ACTION' ? 'donut_large' : 'filter_alt',
            label: $t(localeStringsMap.customBehaviorComponents['action' in vv ? vv.action.type : vv.condition.type])
          }
        })
      }
    })
  })

const confirmLoading = ref(false)

const onConfirm = async () => {
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
