<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-banner v-if="isReady" :class="`${state.issues.length ? 'bg-warning' : 'bg-positive'} rounded-borders`" dense>
          <span class="text-h6">
            {{ state.issues.length ? 'We have some issues' : 'All systems operational' }}
          </span>

          <ul v-if="state.issues.length" class="q-mb-none">
            <li v-for="(issue, i) in state.issues" :key="i" v-html="parseMarkdown(issue)"></li>
          </ul>

          <template #avatar>
            <q-avatar size="xl">
              <q-icon v-if="state.issues.length" name="r_error" size="md"></q-icon>
              <q-icon v-else name="r_check_circle" size="md"></q-icon>
            </q-avatar>
          </template>
        </q-banner>

        <q-skeleton v-else type="rect" width="100%" height="62px"></q-skeleton>
      </div>

      <div v-for="n in isReady ? 0 : 4" :key="n" class="col-12 col-sm-6 col-md-3">
        <q-skeleton type="rect" width="100%" height="78px" />
      </div>

      <div v-for="(tiled, i) in isReady ? tiledStats : []" :key="i" class="col-12 col-sm-6 col-md-3">
        <q-card class="bg-dark-1" flat>
          <q-item class="q-pa-md">
            <q-item-section>
              <q-item-label class="text--secondary ellipsis">
                {{ tiled.text }}
              </q-item-label>

              <q-item-section class="text-white text-h5" side>
                <div v-if="isReady">
                  <span v-if="tiled.valueType === 'number'">
                    {{ numbro(tiled.value).format({ thousandSeparated: true }) }}
                  </span>

                  <span v-else>
                    {{ tiled.value }}
                  </span>
                </div>

                <div v-else>
                  <q-skeleton type="text" width="64px" height="32px" />
                </div>
              </q-item-section>
            </q-item-section>

            <q-item-section side>
              <q-avatar rounded color="dark-3" :icon="tiled.icon" />
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="col-12">
        <q-card class="bg-dark-1" flat>
          <q-item class="q-py-md">
            <q-item-section>
              <q-item-label class="text-subtitle1">
                {{ $t('Pages.StatePage.Shards') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator inset></q-separator>

          <q-card-section>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(48px, 1fr)); gap: 16px">
              <q-skeleton v-for="n in isReady ? 0 : 8" :key="n" type="rect" width="48px" height="48px" />

              <div v-for="shard in state.shards" :key="shard.cluster_id" class="cursor-help">
                <q-avatar :class="`${getShardColor(shard.latency)}`" rounded>
                  <span class="text-body1">#{{ shard.cluster_id }}</span>

                  <q-tooltip class="bg-black text-body2" transition-show="" transition-hide="">
                    <div class="text-h6">{{ shard.host }}#{{ shard.cluster_id }}</div>
                    <div>
                      {{ $t('Commands.AboutCommand.Texts.Latency') }}:
                      {{ numbro(shard.latency).format({ thousandSeparated: true, mantissa: 1 }) }} ms
                    </div>
                    <div>
                      {{ $t('Commands.AboutCommand.Texts.ShardUptime') }}:
                      {{ numbro(shard.uptime / 1000).format({ output: 'time' }) }}
                    </div>

                    <q-separator class="q-my-sm"></q-separator>

                    <div>
                      {{ $t('Commands.AboutCommand.Texts.TotalGuilds') }}:
                      {{ numbro(shard.guilds).format({ thousandSeparated: true }) }}
                    </div>
                    <div>
                      {{ $t('Commands.AboutCommand.Texts.TotalUsers') }}:
                      {{ numbro(shard.users).format({ thousandSeparated: true }) }}
                    </div>
                    <div>
                      {{ $t('Pages.StatePage.TotalChannels') }}:
                      {{ numbro(shard.channels).format({ thousandSeparated: true }) }}
                    </div>
                  </q-tooltip>
                </q-avatar>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12">
        <q-card class="bg-dark-1" flat>
          <q-item class="q-py-md">
            <q-item-section>
              <q-item-label class="text-subtitle1">
                {{ $t('Pages.StatePage.MusicPlayers') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-separator inset></q-separator>

          <q-card-section class="row q-col-gutter-md">
            <div v-for="n in isReady ? 0 : 4" :key="n" class="col-12 col-sm-6 col-md-3">
              <q-skeleton type="rect" width="100%" height="78px" />
            </div>

            <div v-for="player in state.players" :key="player.id" class="col-12 col-sm-6 col-md-3">
              <q-card class="bg-dark-2" flat>
                <q-item class="q-pa-md">
                  <q-item-section>
                    <q-item-label class="text-body1 ellipsis">
                      <q-icon v-if="player.connected" name="r_circle" color="positive"></q-icon>
                      <q-icon v-else name="r_circle" color="negative"></q-icon>
                      {{ player.id }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-circular-progress
                      class="cursor-help ellipsis"
                      show-value
                      :value="player.cpu_load"
                      color="primary"
                      track-color="dark-3"
                      size="xl"
                    >
                      {{ Math.round(player.cpu_load * 100) }}%
                      <q-tooltip
                        class="bg-black text-body2"
                        anchor="top middle"
                        self="bottom middle"
                        transition-show=""
                        transition-hide=""
                      >
                        {{ $t('Pages.StatePage.PlayerCPULoad') }}
                      </q-tooltip>
                    </q-circular-progress>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useMeta, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { numbro } from 'src/boot/numbro'
import { parseMarkdown } from 'src/utils/Markdown'
import { handleAxiosError } from 'src/utils/Utils'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const $q = useQuasar(),
  i18n = useI18n()

const pageLoading = ref(true)
const state = ref({}),
  stateUpdateInterval = ref(null)

const stateIsEmpty = computed(() => {
  return !Object.keys(state.value).length
})

const isReady = computed(() => {
  return !pageLoading.value && !stateIsEmpty.value
})

const averageLatency = computed(() => {
  const sum = state.value.shards.reduce((x, y) => x + y.latency, 0),
    latency = sum / state.value.shards.length

  return latency
})

const tiledStats = computed(() => {
  return [
    {
      text: i18n.t('Commands.AboutCommand.Texts.TotalGuilds'),
      value: state.value.guilds,
      valueType: 'number',
      icon: 'r_workspaces'
    },
    {
      text: i18n.t('Commands.AboutCommand.Texts.TotalUsers'),
      value: state.value.users,
      valueType: 'number',
      icon: 'r_groups'
    },
    {
      text: i18n.t('Pages.StatePage.TotalChannels'),
      value: state.value.channels,
      valueType: 'number',
      icon: 'r_tag'
    },
    {
      text: i18n.t('Pages.StatePage.AvgLatency'),
      value: `${numbro(averageLatency.value || 0).format({ thousandSeparated: true, mantissa: 1 })} ms`,
      valueType: 'text',
      icon: 'r_network_ping'
    }
  ]
})

useMeta({
  title: 'State',
  meta: {
    description: {
      name: 'description',
      content:
        'Stay informed about the status and statistics of Lacuna. Get real-time updates on uptime, performance, and service availability.'
    },
    keywords: {
      name: 'keywords',
      content: 'status page, service stats, uptime, performance'
    }
  }
})

const getState = async () => {
  try {
    const response = await interfaces.common.getState(),
      { data } = response

    state.value = data
  } catch (err) {
    const error = handleAxiosError(err)

    $q.notify({
      message: error.message,
      classes: 'q-notification-custom',
      color: 'black',
      icon: 'close',
      iconColor: 'negative',
      timeout: 5000
    })
  }

  return state.value
}

const getShardColor = shardLatency => {
  if (shardLatency >= 150 && shardLatency < 500) return 'bg-warning'
  if (shardLatency >= 500) return 'bg-negative'
  return 'bg-dark-2'
}

onMounted(async () => {
  await getState()
  stateUpdateInterval.value = setInterval(() => getState(), 30000)

  pageLoading.value = false
})

onBeforeUnmount(() => {
  clearInterval(stateUpdateInterval.value)
})
</script>
