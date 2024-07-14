<template>
  <q-page class="q-pa-md">
    <div v-if="pageLoading || stateIsEmpty" class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-card class="bg-dark-1" flat>
              <q-list padding>
                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('Commands.AboutCommand.Texts.TotalGuilds') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <q-skeleton type="text" width="50px" />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('Commands.AboutCommand.Texts.TotalUsers') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <q-skeleton type="text" width="50px" />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('Pages.StatePage.TotalChannels') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <q-skeleton type="text" width="50px" />
                  </q-item-section>
                </q-item>
              </q-list>

              <q-separator inset></q-separator>

              <q-list padding>
                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('Pages.StatePage.AvgLatency') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <q-skeleton type="text" width="50px" />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('Commands.AboutCommand.Texts.CurrentVersion') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <q-skeleton type="text" width="50px" />
                  </q-item-section>
                </q-item>
              </q-list>
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

              <q-list padding>
                <q-item v-for="n in 6" :key="n">
                  <q-item-section>
                    <q-skeleton type="text" width="75px" height="100%" />
                  </q-item-section>

                  <q-item-section side>
                    <q-skeleton type="text" width="100px" height="100%" />
                  </q-item-section>
                </q-item>
              </q-list>
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

              <q-list padding>
                <q-item v-for="n in 1" :key="n">
                  <q-item-section avatar>
                    <q-skeleton type="text" width="50px" height="100%" />
                  </q-item-section>

                  <q-item-section>
                    <q-skeleton type="text" width="100%" height="100%" />
                  </q-item-section>

                  <q-item-section side>
                    <q-skeleton type="text" width="25px" height="100%" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-8">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-card class="bg-dark-1" flat>
              <q-card-section>
                <q-skeleton type="rect" width="100%" height="400px"></q-skeleton>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card class="bg-dark-1" flat>
              <q-card-section>
                <q-skeleton type="rect" width="100%" height="400px"></q-skeleton>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card class="bg-dark-1" flat>
              <q-card-section>
                <q-skeleton type="rect" width="100%" height="400px"></q-skeleton>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-card class="bg-dark-1" flat>
              <q-list padding>
                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('Commands.AboutCommand.Texts.TotalGuilds') }}
                  </q-item-section>

                  <q-item-section class="text-white text-subtitle1" side>{{ state.guilds }}</q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('Commands.AboutCommand.Texts.TotalUsers') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <div>
                      <span class="text-white">{{ state.cached_users }}</span>
                      <span>/{{ state.users }}</span>
                    </div>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('Pages.StatePage.TotalChannels') }}
                  </q-item-section>

                  <q-item-section class="text-white text-subtitle1" side>{{ state.channels }}</q-item-section>
                </q-item>
              </q-list>

              <q-separator inset></q-separator>

              <q-list padding>
                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('Pages.StatePage.AvgLatency') }}
                  </q-item-section>

                  <q-item-section :class="`${averageLatency.color} text-subtitle1`" side>
                    {{ Math.round(averageLatency.value) || 0 }}MS
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('Commands.AboutCommand.Texts.CurrentVersion') }}
                  </q-item-section>

                  <q-item-section class="text-white text-subtitle1" side>v{{ state.version }}</q-item-section>
                </q-item>
              </q-list>
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

              <q-card-section>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(48px, 1fr)); gap: 16px">
                  <div v-for="shard in state.shards" :key="shard.cluster_id" class="cursor-help">
                    <q-avatar :class="`${getShardColor(shard.latency)}`" rounded>
                      <span class="text-body1">#{{ shard.cluster_id }}</span>

                      <q-tooltip class="bg-black text-body2" transition-show="" transition-hide="">
                        <div class="text-h6">{{ shard.host }}#{{ shard.cluster_id }}</div>
                        <div>{{ $t('Commands.AboutCommand.Texts.Latency') }}: {{ Math.round(shard.latency) }}MS</div>
                        <div>
                          {{ $t('Commands.AboutCommand.Texts.ShardUptime') }}:
                          {{ $numbro(shard.uptime / 1000).format({ output: 'time' }) }}
                        </div>

                        <q-separator class="q-my-sm"></q-separator>

                        <div>{{ $t('Commands.AboutCommand.Texts.TotalGuilds') }}: {{ shard.guilds }}</div>
                        <div>
                          {{ $t('Commands.AboutCommand.Texts.TotalUsers') }}: {{ shard.cached_users }}/{{ shard.users }}
                        </div>
                        <div>{{ $t('Pages.StatePage.TotalChannels') }}: {{ shard.channels }}</div>
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

              <q-list padding>
                <q-item
                  v-for="player in state.players"
                  :key="player.id"
                  :class="`${player.connected ? '' : 'bg-negative'}`"
                >
                  <q-item-section>
                    <q-item-label class="text-uppercase">
                      {{ player.id }}
                      <span class="text--secondary">{{ player.players.playing }}/{{ player.players.total }}</span>
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <!-- <q-linear-progress class="rounded-borders" track-color="dark-2" :value="player.cpu_load" size="xl">
                      <div class="absolute-center text-white">{{ Math.round(player.cpu_load * 100) }}%</div>
                      <q-tooltip
                        class="bg-black text-body2"
                        anchor="top middle"
                        self="bottom middle"
                        transition-show=""
                        transition-hide=""
                      >
                        {{ $t('Pages.StatePage.PlayerCPULoad') }}
                      </q-tooltip>
                    </q-linear-progress> -->

                    <q-circular-progress
                      class="cursor-help ellipsis"
                      show-value
                      :value="player.cpu_load"
                      color="primary"
                      track-color="dark-2"
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
              </q-list>
            </q-card>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-8">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-card class="bg-dark-1" flat>
              <q-card-section>
                <LineChart
                  :chart-data="metricsData.totalGuilds"
                  :chart-options="{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: $t('Commands.AboutCommand.Texts.TotalGuilds') },
                      legend: { display: false },
                      tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                      x: { ticks: { display: false } }
                    }
                  }"
                ></LineChart>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card class="bg-dark-1" flat>
              <q-card-section>
                <LineChart
                  :chart-data="metricsData.shardLatencies"
                  :chart-options="{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: $t('Pages.StatePage.ShardLatencies') },
                      tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                      x: { ticks: { display: false } }
                    }
                  }"
                ></LineChart>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12">
            <q-card class="bg-dark-1" flat>
              <q-card-section>
                <LineChart
                  :chart-data="metricsData.commandUsageCount"
                  :chart-options="{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: $t('Pages.StatePage.CommandUses') },
                      legend: { reverse: true },
                      tooltip: { mode: 'nearest', intersect: false }
                    },
                    scales: {
                      x: { ticks: { display: false } }
                    }
                  }"
                ></LineChart>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useMeta, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { DateTime } from 'src/boot/luxon'
import LineChart from 'src/components/LineChart.vue'
import { handleAxiosError, hashCode, hexToRGB } from 'src/utils/Utils'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const $q = useQuasar()

const pageLoading = ref(true)
const state = ref({}),
  stateUpdateInterval = ref(null)

const averageLatency = computed(() => {
  const sum = state.value.shards.reduce((x, y) => x + y.latency, 0)
  const latency = sum / state.value.shards.length

  let color = 'text-white'
  if (latency >= 150 && latency < 500) color = 'text-warning'
  if (latency >= 500) color = 'text-negative'

  return {
    value: latency,
    color
  }
})
const metricsData = ref({
  totalGuilds: computed(() => {
    return {
      labels: state.value.metrics.total_guilds.map(i => DateTime.fromMillis(i.timestamp).toFormat('ccc HH:mm')),
      datasets: [
        {
          data: state.value.metrics.total_guilds.map(i => i.data),
          backgroundColor: 'rgba(218, 112, 214, 0.1)',
          borderColor: 'rgba(218, 112, 214, 0.6)',
          borderWidth: 1,
          pointRadius: 0,
          fill: 'start'
        }
      ]
    }
  }),
  shardLatencies: computed(() => {
    const latencies = state.value.metrics.shard_latencies.map(i => i.data),
      shards = state.value.shards.map(i => {
        return { cluster_id: i.cluster_id, latencies: latencies.map(ii => ii[i.cluster_id] || 0) }
      })

    return {
      labels: state.value.metrics.shard_latencies.map(i => DateTime.fromMillis(i.timestamp).toFormat('ccc HH:mm')),
      datasets: shards.map(shard => {
        return {
          label: `#${shard.cluster_id}`,
          data: shard.latencies,
          backgroundColor: `rgba(${hexToRGB(hashCode(`#${shard.cluster_id}#${shard.cluster_id}`))}, 0.1)`,
          borderColor: `rgba(${hexToRGB(hashCode(`#${shard.cluster_id}#${shard.cluster_id}`))}, 0.6)`,
          borderWidth: 1,
          pointRadius: 1.2,
          fill: 'start'
        }
      })
    }
  }),
  commandUsageCount: computed(() => {
    const usageCount = state.value.metrics.command_usage_count.map(i => i.data),
      commands = Object.keys(usageCount?.[0] ?? {}).map(k => {
        return {
          name: k,
          uses: usageCount.map(c => {
            return c[k]
          })
        }
      })

    return {
      labels: state.value.metrics.command_usage_count.map(i => DateTime.fromMillis(i.timestamp).toFormat('ccc HH:mm')),
      datasets: commands.map(command => {
        return {
          label: command.name,
          data: command.uses,
          backgroundColor: `rgba(${hexToRGB(hashCode(command.name))}, 0.1)`,
          borderColor: `rgba(${hexToRGB(hashCode(command.name))}, 0.6)`,
          borderWidth: 1,
          pointRadius: 0,
          fill: 'start'
        }
      })
    }
  })
})
const stateIsEmpty = computed(() => {
  return !Boolean(Object.keys(state.value).length)
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
