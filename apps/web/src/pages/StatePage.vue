<template>
  <q-page class="q-pa-md">
    <div v-if="pageLoading || stateIsEmpty" class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-card class="bg-dark-1" flat>
              <q-list>
                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('pages.state.total_guilds') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <q-skeleton type="text" width="50px" />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('pages.state.total_users') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <q-skeleton type="text" width="50px" />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('pages.state.total_channels') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <q-skeleton type="text" width="50px" />
                  </q-item-section>
                </q-item>
              </q-list>

              <q-separator inset></q-separator>

              <q-list>
                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('pages.state.avg_latency') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <q-skeleton type="text" width="50px" />
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('pages.state.current_version') }}
                  </q-item-section>

                  <q-item-section class="text-subtitle1" side>
                    <q-skeleton type="text" width="50px" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <div class="col-12">
            <q-card class="rounded-lg bg-dark-1" flat>
              <q-item class="q-pt-md">
                <q-item-section>
                  <q-item-label class="text-subtitle1">
                    {{ $t('pages.state.clusters_title') }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-list padding>
                <q-item v-for="n in 2" :key="n">
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
            <q-card class="rounded-lg bg-dark-1" flat>
              <q-item class="q-pt-md">
                <q-item-section>
                  <q-item-label class="text-subtitle1">
                    {{ $t('pages.state.shards_title') }}
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
            <q-card class="rounded-lg bg-dark-1" flat>
              <q-item class="q-pt-md">
                <q-item-section>
                  <q-item-label class="text-subtitle1">
                    {{ $t('pages.state.players_title') }}
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
            <q-card class="rounded-lg bg-dark-1" flat>
              <q-list>
                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('pages.state.total_guilds') }}
                  </q-item-section>

                  <q-item-section class="text-white text-subtitle1" side>{{ state.guilds }}</q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('pages.state.total_users') }}
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
                    {{ $t('pages.state.total_channels') }}
                  </q-item-section>

                  <q-item-section class="text-white text-subtitle1" side>{{ state.channels }}</q-item-section>
                </q-item>
              </q-list>

              <q-separator inset></q-separator>

              <q-list>
                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('pages.state.avg_latency') }}
                  </q-item-section>

                  <q-item-section :class="`${averageLatency.color} text-subtitle1`" side>
                    {{ Math.round(averageLatency.value) }}MS
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section class="text--secondary">
                    {{ $t('pages.state.current_version') }}
                  </q-item-section>

                  <q-item-section class="text-white text-subtitle1" side>v{{ state.version }}</q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>

          <div class="col-12">
            <q-card class="rounded-lg bg-dark-1" flat>
              <q-item class="q-pt-md">
                <q-item-section>
                  <q-item-label class="text-subtitle1">
                    {{ $t('pages.state.clusters_title') }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-list padding>
                <q-expansion-item v-for="server in state.servers" :key="server.hostname" expand-separator>
                  <template #header>
                    <q-item-section>
                      <q-item-label>{{ server.hostname }}</q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      {{ $numbro(server.uptime).format({ output: 'time' }) }}
                    </q-item-section>
                  </template>

                  <q-card class="rounded-lg bg-dark-1" flat>
                    <q-card-section>
                      <div class="row q-col-gutter-md">
                        <div class="col-6">
                          <q-linear-progress
                            class="rounded-lg"
                            track-color="dark-2"
                            :value="server.cpu_usage / 100"
                            size="xl"
                          >
                            <div class="absolute-center text-white">{{ server.cpu_usage }}%</div>
                            <q-tooltip
                              class="bg-black rounded-lg text-body2"
                              anchor="top middle"
                              self="bottom middle"
                              transition-show=""
                              transition-hide=""
                            >
                              {{ $t('pages.state.cluster_cpu_usage') }}
                            </q-tooltip>
                          </q-linear-progress>
                        </div>

                        <div class="col-6">
                          <q-linear-progress
                            class="rounded-lg"
                            track-color="dark-2"
                            :value="server.memory_usage / 100"
                            size="xl"
                          >
                            <div class="absolute-center text-white">{{ server.memory_usage }}%</div>
                            <q-tooltip
                              class="bg-black rounded-lg text-body2"
                              anchor="top middle"
                              self="bottom middle"
                              transition-show=""
                              transition-hide=""
                            >
                              {{ $t('pages.state.cluster_memory_usage') }}
                            </q-tooltip>
                          </q-linear-progress>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </q-list>
            </q-card>
          </div>

          <div class="col-12">
            <q-card class="rounded-lg bg-dark-1" flat>
              <q-item class="q-pt-md">
                <q-item-section>
                  <q-item-label class="text-subtitle1">
                    {{ $t('pages.state.shards_title') }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-list padding>
                <q-expansion-item
                  v-for="shard in state.shards"
                  :key="shard.cluster_id"
                  :class="`${getShardColor(shard.latency)}`"
                  expand-separator
                >
                  <template #header>
                    <q-item-section>
                      <q-item-label>{{ shard.hostname }}#{{ shard.cluster_id }}</q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <div>
                        <span>{{ Math.round(shard.latency) }}MS</span>
                        <span class="q-px-sm">-</span>
                        <span>{{ $numbro(shard.uptime / 1000).format({ output: 'time' }) }}</span>
                      </div>
                    </q-item-section>
                  </template>

                  <q-card class="no-border-radius bg-dark-1" flat>
                    <q-card-section>
                      <div class="row">
                        <div class="col">
                          <span>
                            <q-icon class="opacity-md" name="hub"></q-icon>
                            {{ shard.guilds }}

                            <q-tooltip
                              class="bg-black rounded-lg text-body2"
                              anchor="top middle"
                              self="bottom middle"
                              transition-show=""
                              transition-hide=""
                            >
                              {{ $t('pages.state.shard_guilds') }}
                            </q-tooltip>
                          </span>
                        </div>

                        <div class="col text-center">
                          <span>
                            <q-icon class="opacity-md" name="group"></q-icon>
                            {{ shard.cached_users }}/{{ shard.users }}

                            <q-tooltip
                              class="bg-black rounded-lg text-body2"
                              anchor="top middle"
                              self="bottom middle"
                              transition-show=""
                              transition-hide=""
                            >
                              {{ $t('pages.state.shard_users') }}
                            </q-tooltip>
                          </span>
                        </div>

                        <div class="col text-right">
                          <span>
                            <q-icon class="opacity-md" name="forum"></q-icon>
                            {{ shard.channels }}

                            <q-tooltip
                              class="bg-black rounded-lg text-body2"
                              anchor="top middle"
                              self="bottom middle"
                              transition-show=""
                              transition-hide=""
                            >
                              {{ $t('pages.state.shard_channels') }}
                            </q-tooltip>
                          </span>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </q-list>
            </q-card>
          </div>

          <div class="col-12">
            <q-card class="rounded-lg bg-dark-1" flat>
              <q-item class="q-pt-md">
                <q-item-section>
                  <q-item-label class="text-subtitle1">
                    {{ $t('pages.state.players_title') }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-list padding>
                <q-item
                  v-for="player in state.players"
                  :key="player.id"
                  :class="`${player.connected ? '' : 'bg-negative'}`"
                >
                  <q-item-section avatar>
                    <q-item-label class="text-uppercase">
                      {{ player.id }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section>
                    <q-linear-progress class="rounded-lg" track-color="dark-2" :value="player.cpu_load" size="xl">
                      <div class="absolute-center text-white">{{ Math.round(player.cpu_load * 100) }}%</div>
                      <q-tooltip
                        class="bg-black rounded-lg text-body2"
                        anchor="top middle"
                        self="bottom middle"
                        transition-show=""
                        transition-hide=""
                      >
                        {{ $t('pages.state.player_cpu_load') }}
                      </q-tooltip>
                    </q-linear-progress>
                  </q-item-section>

                  <q-item-section class="text-uppercase" side>
                    {{ player.players.playing }}/{{ player.players.total }}
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
            <q-card class="rounded-lg bg-dark-1" flat>
              <q-card-section>
                <LineChart
                  :chart-data="metricsData.totalGuilds"
                  :chart-options="{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: $t('pages.state.total_guilds') },
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
            <q-card class="rounded-lg bg-dark-1" flat>
              <q-card-section>
                <LineChart
                  :chart-data="metricsData.shardLatencies"
                  :chart-options="{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: $t('pages.state.shards_latency') },
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
            <q-card class="rounded-lg bg-dark-1" flat>
              <q-card-section>
                <LineChart
                  :chart-data="metricsData.commandUsageCount"
                  :chart-options="{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: { display: true, text: $t('pages.state.command_uses') },
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
    const response = await interfaces.state.get(),
      { data } = response

    state.value = data
  } catch (err) {
    const error = handleAxiosError(err)

    $q.notify({
      message: error.message,
      classes: 'rounded-lg q-notification-custom',
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
  return ''
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
