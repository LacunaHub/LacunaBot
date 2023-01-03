<template>
  <q-page class="q-pa-md">
    <div v-if="pageLoading" class="absolute-center">
      <q-spinner-tail color="white" size="64px"></q-spinner-tail>
    </div>

    <transition enter-active-class="animated fadeInUp" leave-active-class="animated fadeOutDown" appear>
      <div v-if="!pageLoading" class="row q-col-gutter-md">
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

                    <q-item-section :class="`${avgLatency.color} text-subtitle1`" side>
                      {{ Math.round(avgLatency.value) }}MS
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
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-subtitle1">
                      {{ $t('pages.state.clusters_title') }}
                    </q-item-label>
                    <q-item-label class="text--secondary">
                      {{ $t('pages.state.clusters_description') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-list padding separator>
                  <q-item v-for="server in state.servers" :key="server.hostname">
                    <q-item-section avatar>
                      <q-item-label>{{ server.hostname }}</q-item-label>
                    </q-item-section>

                    <q-item-section>
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
                              class="bg-black rounded-lg"
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
                              class="bg-black rounded-lg"
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
                    </q-item-section>

                    <q-item-section side>
                      {{ $numbro(server.uptime).format({ output: 'time' }) }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>

            <div class="col-12">
              <q-card class="rounded-lg bg-dark-1" flat>
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-subtitle1">
                      {{ $t('pages.state.shards_title') }}
                    </q-item-label>
                    <q-item-label class="text--secondary">
                      {{ $t('pages.state.shards_description') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-list padding separator>
                  <q-item
                    v-for="shard in state.shards"
                    :key="shard.cluster_id"
                    :class="`${getShardColor(shard.latency)}`"
                  >
                    <q-item-section avatar>
                      <q-item-label>{{ shard.hostname }}#{{ shard.cluster_id }}</q-item-label>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>
                        <span>
                          <q-icon class="opacity-md" name="hub"></q-icon>
                          {{ shard.guilds }}

                          <q-tooltip
                            class="bg-black rounded-lg"
                            anchor="top middle"
                            self="bottom middle"
                            transition-show=""
                            transition-hide=""
                          >
                            {{ $t('pages.state.shard_guilds') }}
                          </q-tooltip>
                        </span>
                        <span class="q-px-sm">-</span>
                        <span>
                          <q-icon class="opacity-md" name="group"></q-icon>
                          {{ shard.cached_users }}/{{ shard.users }}

                          <q-tooltip
                            class="bg-black rounded-lg"
                            anchor="top middle"
                            self="bottom middle"
                            transition-show=""
                            transition-hide=""
                          >
                            {{ $t('pages.state.shard_users') }}
                          </q-tooltip>
                        </span>
                        <span class="q-px-sm">-</span>
                        <span>
                          <q-icon class="opacity-md" name="forum"></q-icon>
                          {{ shard.channels }}

                          <q-tooltip
                            class="bg-black rounded-lg"
                            anchor="top middle"
                            self="bottom middle"
                            transition-show=""
                            transition-hide=""
                          >
                            {{ $t('pages.state.shard_channels') }}
                          </q-tooltip>
                        </span>
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <div>
                        <span>{{ shard.latency }}MS</span>
                        <span class="q-px-sm">-</span>
                        <span>{{ $numbro(shard.uptime / 1000).format({ output: 'time' }) }}</span>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>

            <div class="col-12">
              <q-card class="rounded-lg bg-dark-1" flat>
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-subtitle1">
                      {{ $t('pages.state.players_title') }}
                    </q-item-label>
                    <q-item-label class="text--secondary">
                      {{ $t('pages.state.players_description') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-list padding separator>
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
                      <q-linear-progress
                        class="rounded-lg"
                        track-color="dark-2"
                        :value="player.cpu_load / 100"
                        size="xl"
                      >
                        <div class="absolute-center text-white">{{ player.cpu_load }}%</div>
                        <q-tooltip
                          class="bg-black rounded-lg"
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
                    :chart-data="guildsChartData"
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
                    :chart-data="pingsChartData"
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
                    :chart-data="commandUsesChartData"
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
    </transition>
  </q-page>
</template>

<script>
import { useMeta } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { defineComponent } from 'vue'
import LineChart from 'src/components/LineChart.vue'
import { hexToRGB, hashCode } from 'src/utils/Utils'

export default defineComponent({
  name: 'StatePage',

  setup() {
    useMeta({
      title: 'State'
    })
  },

  components: { LineChart },

  data() {
    return {
      pageLoading: true,
      state: {},
      getStateError: null,
      updateInterval: null
    }
  },

  computed: {
    avgLatency() {
      const sum = this.state.shards.reduce((x, y) => x + y.latency, 0)
      const latency = sum / this.state.shards.length

      let color = 'text-white'
      if (latency >= 150 && latency < 500) color = 'text-warning'
      if (latency >= 500) color = 'text-negative'

      return {
        value: latency,
        color
      }
    },
    guildsChartData() {
      return {
        labels: this.state.charts.guilds.map(g => this.$dt.fromMillis(g.ts).toFormat('ccc HH:mm')),
        datasets: [
          {
            data: this.state.charts.guilds.map(g => g.n),
            backgroundColor: 'rgba(218, 112, 214, 0.1)',
            borderColor: 'rgba(218, 112, 214, 0.6)',
            borderWidth: 1,
            pointRadius: 0,
            fill: 'start'
          }
        ]
      }
    },
    pingsChartData() {
      const pings = this.state.charts.pings.map(p => p.d)
      const shards = this.state.shards.map(s => {
        return { cluster_id: s.cluster_id, pings: pings.map(p => p[s.cluster_id] || 0) }
      })

      return {
        labels: this.state.charts.pings.map(p => this.$dt.fromMillis(p.ts).toFormat('ccc HH:mm')),
        datasets: shards.map(shard => {
          return {
            label: `#${shard.cluster_id}`,
            data: shard.pings,
            backgroundColor: `rgba(${hexToRGB(hashCode(`#${shard.cluster_id}#${shard.cluster_id}`))}, 0.1)`,
            borderColor: `rgba(${hexToRGB(hashCode(`#${shard.cluster_id}#${shard.cluster_id}`))}, 0.6)`,
            borderWidth: 1,
            pointRadius: 1.2,
            fill: 'start'
          }
        })
      }
    },
    commandUsesChartData() {
      const command_uses = this.state.charts.command_uses.map(c => c.d)
      const commands = Object.keys(command_uses[0]).map(k => {
        return {
          name: k,
          uses: command_uses.map(c => {
            return c[k]
          })
        }
      })

      return {
        labels: this.state.charts.command_uses.map(c => this.$dt.fromMillis(c.ts).toFormat('ccc HH:mm')),
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
    }
  },

  methods: {
    async getState() {
      return interfaces.state
        .get()
        .then(response => {
          this.state = response.data
        })
        .catch(() => (this.getStateError = err.message))
    },
    getShardColor(shardLatency) {
      if (shardLatency >= 150 && shardLatency < 500) return 'bg-warning'
      if (shardLatency >= 500) return 'bg-negative'
      return ''
    }
  },

  async mounted() {
    await this.getState()
    this.updateInterval = setInterval(() => this.getState(), 30000)

    this.pageLoading = false
  },

  beforeUnmount() {
    clearInterval(this.updateInterval)
  }
})
</script>
